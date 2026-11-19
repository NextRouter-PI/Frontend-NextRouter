#!/usr/bin/env node
/**
 * Script automatizado de teste de entrega de arquivos estáticos e SPA no NextRouter.
 * 
 * Funcionalidades:
 * 1. Compila o Vue de forma isolada (sem alterar diretórios do projeto).
 * 2. Prepara e verifica o artefato usando o contrato do backend (prepare_artifact / verify_artifact).
 * 3. Inicia o servidor Daphne ASGI com configurações descartáveis em /tmp/opencode/.
 * 4. Executa bateria completa de asserções HTTP (headers, cache, ETag, 404 estrito, SPA fallback).
 * 5. Suporta o modo '--serve' para manter o servidor ativo para testes no navegador.
 */

import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

async function freePort(preferred = 0) {
  if (preferred > 0) {
    try {
      const server = createServer()
      server.listen(preferred, '127.0.0.1')
      await once(server, 'listening')
      await new Promise((done) => server.close(done))
      return preferred
    } catch {
      // Porta ocupada, aloca dinâmica
    }
  }
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}

async function stopChild(child, timeout = 5000) {
  const finished = () => child.exitCode !== null || child.signalCode !== null
  if (!child || !child.pid || finished()) return
  const exited = once(child, 'exit')
  child.kill('SIGTERM')
  await Promise.race([exited, delay(timeout, undefined, { ref: false })])
  if (!finished()) {
    child.kill('SIGKILL')
    await exited
  }
}

async function waitFor(condition, description, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if (await condition()) return
    } catch {
      // Aguardando startup
    }
    await delay(100)
  }
  throw new Error(`Timeout aguardando: ${description}`)
}

function findPython(backendDir) {
  const venvPython = resolve(backendDir, '.venv/bin/python')
  if (existsSync(venvPython)) {
    try {
      const res = spawnSync(venvPython, ['--version'], { encoding: 'utf8' })
      if (res.status === 0) return venvPython
    } catch {
      // Continua busca
    }
  }
  for (const candidate of ['python3.13', 'python3', 'python']) {
    try {
      const res = spawnSync(candidate, ['--version'], { encoding: 'utf8' })
      if (res.status === 0) return candidate
    } catch {
      // Continua busca
    }
  }
  throw new Error('Interpretador Python não encontrado.')
}

export async function main() {
  const args = process.argv.slice(2)
  const isServeMode = args.includes('--serve') || args.includes('-s')
  const portArgIndex = args.findIndex((a) => a === '--port' || a === '-p')
  const requestedPort = portArgIndex !== -1 && args[portArgIndex + 1] ? Number(args[portArgIndex + 1]) : isServeMode ? 8000 : 0

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node test_static_serving.mjs [opções]

Opções:
  -s, --serve          Roda os testes e mantém o servidor ativo para testes no navegador
  -p, --port <porta>   Porta para rodar o servidor (padrão: 8000 com --serve, ou porta dinâmica)
  -h, --help           Exibe esta mensagem de ajuda
`)
    return
  }

  const scriptDir = fileURLToPath(new URL('.', import.meta.url))
  const frontendDir = resolve(scriptDir, '..')
  const backendDir = resolve(frontendDir, '../backend')

  if (!existsSync(frontendDir) || !existsSync(backendDir)) {
    throw new Error('Diretórios frontend ou backend não encontrados na estrutura esperada.')
  }

  const python = findPython(backendDir)

  const git = (cwd, gitArgs) => {
    try {
      const result = spawnSync('git', gitArgs, { cwd, encoding: 'utf8' })
      if (result.status === 0) return result.stdout.trim()
    } catch {
      // Ignora erro de git em ambiente sem repositório inicializado
    }
    return '0'.repeat(40)
  }

  const frontendRevision = git(frontendDir, ['rev-parse', 'HEAD']) || '0'.repeat(40)
  const backendRevision = git(backendDir, ['rev-parse', 'HEAD']) || '0'.repeat(40)

  const root = await mkdtemp('/tmp/opencode/nr-static-test-')
  const children = []
  let stage = 'inicialização'

  console.log('------------------------------------------------------------')
  console.log('🧪 NextRouter — Teste Automatizado de Entrega de Estáticos e SPA')
  console.log('------------------------------------------------------------')
  console.log(`Frontend: ${frontendDir} (${frontendRevision.slice(0, 10)})`)
  console.log(`Backend:  ${backendDir} (${backendRevision.slice(0, 10)})`)
  console.log(`Python:   ${python}`)
  console.log(`Sandbox:  ${root}`)

  try {
    // 1. Build do Frontend
    stage = 'build do Vue'
    process.stdout.write('\n📦 [1/4] Compilando frontend Vue (Vite)... ')
    const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', `${root}/dist`, '--logLevel', 'error'], {
      cwd: frontendDir,
      encoding: 'utf8',
      timeout: 120000,
    })
    if (build.status !== 0) {
      throw new Error(`Build do Vite falhou:\n${build.stderr || build.stdout}`)
    }
    console.log('✓ OK')

    // 2. Preparação e verificação do artefato
    stage = 'preparação do artefato'
    process.stdout.write('📋 [2/4] Preparando e verificando artefato (prepare_artifact)... ')
    const env = {
      ...process.env,
      DJANGO_SETTINGS_MODULE: 'nr_static_smoke_settings',
      PYTHONPATH: `${root}:${backendDir}`,
      DEV_DATABASE_PATH: `${root}/db.sqlite3`,
      DEV_PRIVATE_DOCUMENT_ROOT: `${root}/private`,
      DEV_MEDIA_ROOT: `${root}/media`,
      DEV_LAN_HOST: '',
      DEV_OSRM_URL: '',
      DEV_GEOCODING_URL: '',
      REDIS_URL: '',
      OSRM_URL: '',
      GEOCODING_URL: '',
      EMAIL_HOST: '',
      CLOUDINARY_URL: '',
      DEV_SECRET_KEY: randomBytes(32).toString('hex'),
      PYTHONDONTWRITEBYTECODE: '1',
      FRONTEND_REVISION: frontendRevision,
      BACKEND_REVISION: backendRevision,
      SMOKE_ROOT: root,
    }

    await mkdir(`${root}/private`, { mode: 0o700 })
    await writeFile(
      `${root}/nr_static_smoke_settings.py`,
      `
from app.settings.dev import *
from pathlib import Path
import os
FRONTEND_DIST = Path(os.environ['SMOKE_ROOT']) / 'release' / 'frontend_dist'
MEDIA_ROOT = str(Path(os.environ['SMOKE_ROOT']) / 'media')
`
    )

    const setup = spawnSync(
      python,
      ['-'],
      {
        cwd: backendDir,
        env,
        encoding: 'utf8',
        timeout: 60000,
        input: `
import os
from pathlib import Path
from shared.frontend_artifact import prepare_artifact, verify_artifact

root = Path(os.environ['SMOKE_ROOT'])
prepare_artifact(
    source=root / 'dist',
    destination=root / 'release',
    frontend_revision=os.environ['FRONTEND_REVISION'],
    backend_revision=os.environ['BACKEND_REVISION']
)
verify_artifact(
    root / 'release' / 'frontend_dist',
    expected_backend_revision=os.environ['BACKEND_REVISION']
)
print("PREPARE_OK")
`,
      }
    )

    if (setup.status !== 0 || !setup.stdout.includes('PREPARE_OK')) {
      throw new Error(`Falha na preparação do artefato:\n${setup.stderr || setup.stdout}`)
    }
    console.log('✓ OK')

    // 3. Inicialização do Backend (Daphne ASGI)
    stage = 'inicialização do servidor Daphne'
    const port = await freePort(requestedPort)
    const origin = `http://127.0.0.1:${port}`
    env.DEV_FRONTEND_ORIGIN = origin

    process.stdout.write(`🚀 [3/4] Iniciando Daphne ASGI em ${origin}... `)
    const serverChild = spawn(
      python,
      ['-m', 'daphne', '-b', '127.0.0.1', '-p', String(port), '--access-log', '/dev/null', 'app.asgi:application'],
      {
        cwd: backendDir,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )
    children.push(serverChild)

    await waitFor(async () => {
      const res = await fetch(`${origin}/health/live/`)
      return res.ok
    }, 'Daphne ASGI health check')
    console.log('✓ Conectado')

    // 4. Bateria de Testes HTTP
    stage = 'execução dos testes HTTP'
    console.log('\n🔎 [4/4] Executando validações HTTP dos arquivos estáticos e SPA:\n')

    const testResults = []
    async function testCase(name, fn) {
      try {
        await fn()
        testResults.push({ name, pass: true })
        console.log(`  ✓ ${name}`)
      } catch (err) {
        testResults.push({ name, pass: false, error: err.message })
        console.log(`  ✗ ${name} (${err.message})`)
      }
    }

    // [Teste 1] Raiz da SPA
    await testCase('GET /: Retorna 200, HTML da SPA e Cache-Control: no-cache', async () => {
      const res = await fetch(`${origin}/`, { headers: { Accept: 'text/html' } })
      assert.equal(res.status, 200)
      assert.equal(res.headers.get('cache-control'), 'no-cache')
      assert.match(res.headers.get('content-type') || '', /text\/html/)
      const body = await res.text()
      assert.match(body, /<html|<!doctype html/i)
      assert.match(body, /\/assets\/index-/)
    })

    // [Teste 2] Deep Link SPA
    await testCase('GET /usuario: Deep link sem extensão retorna 200 e index.html', async () => {
      const res = await fetch(`${origin}/usuario`, { headers: { Accept: 'text/html' } })
      assert.equal(res.status, 200)
      assert.equal(res.headers.get('cache-control'), 'no-cache')
      const body = await res.text()
      assert.match(body, /\/assets\/index-/)
    })

    // [Teste 3] HEAD request
    await testCase('HEAD /usuario: Retorna 200, corpo vazio e Content-Length válido', async () => {
      const res = await fetch(`${origin}/usuario`, { method: 'HEAD', headers: { Accept: 'text/html' } })
      assert.equal(res.status, 200)
      assert.equal(await res.text(), '')
      assert.ok(Number(res.headers.get('content-length')) > 0)
    })

    // [Teste 4] Favicon (200 se existir no build, 404 se ausente)
    await testCase('GET /favicon.ico: Responde conforme presença no artefato (200 ou 404 controlado)', async () => {
      const res = await fetch(`${origin}/favicon.ico`)
      if (res.status === 200) {
        assert.match(res.headers.get('content-type') || '', /image\//)
        assert.match(res.headers.get('cache-control') || '', /must-revalidate/)
      } else {
        assert.equal(res.status, 404, 'Se favicon.ico não existe no artefato, deve retornar 404')
      }
    })

    // [Teste 5] Asset compilado real
    let realAssetPath = ''
    const rootRes = await fetch(`${origin}/`, { headers: { Accept: 'text/html' } })
    const rootHtml = await rootRes.text()
    const assetMatch = rootHtml.match(/\/assets\/[a-zA-Z0-9_\-.]+\.js/)
    if (assetMatch) realAssetPath = assetMatch[0]

    if (realAssetPath) {
      await testCase(`GET ${realAssetPath}: Entrega asset com nosniff e ETag`, async () => {
        const res = await fetch(`${origin}${realAssetPath}`)
        assert.equal(res.status, 200)
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
        assert.match(res.headers.get('cache-control') || '', /must-revalidate/)
        assert.ok(res.headers.get('etag'), 'Deve conter cabeçalho ETag')
      })

      // [Teste 6] ETag Revalidation (304)
      await testCase(`GET ${realAssetPath} com If-None-Match: Retorna 304 Not Modified`, async () => {
        const initialRes = await fetch(`${origin}${realAssetPath}`)
        const etag = initialRes.headers.get('etag')
        assert.ok(etag)
        const revalRes = await fetch(`${origin}${realAssetPath}`, { headers: { 'If-None-Match': etag } })
        assert.equal(revalRes.status, 304)
      })
    }

    // [Teste 7] Asset inexistente -> 404 estrito
    await testCase('GET /assets/nao-existe.js: Retorna 404 estrito (não mascara com SPA)', async () => {
      const res = await fetch(`${origin}/assets/nao-existe.js`)
      assert.equal(res.status, 404)
    })

    // [Teste 8] API inexistente -> 404
    await testCase('GET /api/rota-inexistente/: Retorna 404 de API (não recebe index.html)', async () => {
      const res = await fetch(`${origin}/api/rota-inexistente/`)
      assert.equal(res.status, 404)
      const text = await res.text()
      assert.ok(!text.includes('<!doctype html>'), 'API inexistente não pode devolver HTML da SPA')
    })

    // [Teste 9] Arquivos sensíveis e não autorizados -> 404
    for (const forbidden of ['/sw.js', '/manifest.webmanifest', '/frontend-release.json', '/.env']) {
      await testCase(`GET ${forbidden}: Retorna 404 (bloqueado pelo contrato)`, async () => {
        const res = await fetch(`${origin}${forbidden}`)
        assert.equal(res.status, 404)
      })
    }

    // [Teste 10] Métodos inválidos na SPA -> 405 (ou 403 por falta de CSRF em servidor real)
    await testCase('POST /usuario: Recusa POST na rota da SPA (403 CSRF ou 405 Method Not Allowed, nunca 200 SPA)', async () => {
      const res = await fetch(`${origin}/usuario`, { method: 'POST', headers: { Accept: 'text/html' } })
      assert.ok([403, 405].includes(res.status), `Esperado 403 ou 405, recebido ${res.status}`)
    })

    // [Teste 11] Não-HTML na rota da SPA -> 404
    await testCase('GET /usuario com Accept: application/json: Retorna 404', async () => {
      const res = await fetch(`${origin}/usuario`, { headers: { Accept: 'application/json' } })
      assert.equal(res.status, 404)
    })

    const failed = testResults.filter((r) => !r.pass)
    console.log('\n------------------------------------------------------------')
    if (failed.length === 0) {
      console.log(`🎉 Sucesso! Todos os ${testResults.length} testes de estáticos e SPA passaram.`)
    } else {
      console.error(`⚠️ Falha: ${failed.length} de ${testResults.length} testes falharam.`)
      process.exitCode = 1
    }
    console.log('------------------------------------------------------------')

    if (isServeMode && failed.length === 0) {
      console.log(`\n🌐 [MODO SERVIDOR ATIVO]`)
      console.log(`   O backend Daphne ASGI está servindo o frontend compilado em:`)
      console.log(`   👉 ${origin}/`)
      console.log(`\n   Pressione Ctrl+C para encerrar o servidor e limpar recursos.\n`)

      // Mantém o processo vivo até SIGINT/SIGTERM
      await new Promise((resolvePrompt) => {
        const shutdown = () => {
          console.log('\n🛑 Encerrando servidor...')
          resolvePrompt()
        }
        process.on('SIGINT', shutdown)
        process.on('SIGTERM', shutdown)
      })
    }
  } catch (error) {
    console.error(`\n❌ Erro durante etapa [${stage}]: ${error.message}`)
    process.exitCode = 1
  } finally {
    for (const child of children.reverse()) {
      await stopChild(child)
    }
    await rm(root, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
