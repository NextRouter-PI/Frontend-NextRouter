// Smoke do Vue REAL no Django. Node/Firefox/Python já instalados, sem novos pacotes.
import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const port = server.address().port
  await new Promise((done) => server.close(done))
  return port
}

async function waitFor(condition, description) {
  const deadline = Date.now() + 25000
  while (Date.now() < deadline) {
    try { if (await condition()) return } catch { /* Navegação/startup em curso. */ }
    await delay(100)
  }
  throw new Error(`Timeout: ${description}`)
}

async function main() {
  if (!process.argv.includes('--confirm-fictitious')) throw new Error('Exige --confirm-fictitious.')
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('O smoke exige Node >=22 já instalado.')
  // A guarda pode ser verificada com o frontend sozinho, antes de importar o repositório irmão.
  const { stopChild } = await import('../../backend/scripts/test_html_browser.mjs')
  const frontend = fileURLToPath(new URL('../', import.meta.url))
  const backend = resolve(frontend, '../backend')
  const python = resolve(backend, '.venv/bin/python')
  const git = (cwd, args) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
    assert.equal(result.status, 0, 'Checkout Git indisponível.')
    return result.stdout.trim()
  }
  assert.equal(git(frontend, ['status', '--porcelain']), '', 'Commitar o frontend antes de identificar o build real.')
  assert.equal(git(backend, ['status', '--porcelain']), '', 'Backend deve estar em revisão limpa e identificada.')
  const frontendRevision = git(frontend, ['rev-parse', 'HEAD'])
  const backendRevision = git(backend, ['rev-parse', 'HEAD'])
  assert.equal(spawnSync('firefox', ['--version'], { stdio: 'ignore' }).status, 0, 'Exige Firefox já instalado.')
  const root = await mkdtemp(join(tmpdir(), 'nr-vue-browser-'))
  const children = []
  let transport
  let stage = 'build e fixture'
  let success = false
  const password = randomBytes(24).toString('hex')
  const launch = (command, args, env) => {
    const child = spawn(command, args, { cwd: backend, env, stdio: ['ignore', 'pipe', 'pipe'] })
    child.on('error', () => {})
    children.push(child)
    child.stdout.on('data', () => {})
    child.stderr.on('data', () => {})
    return child
  }
  try {
    const port = await freePort()
    const origin = `http://127.0.0.1:${port}`
    const env = {
      ...process.env,
      DJANGO_SETTINGS_MODULE: 'nr_vue_smoke_settings', PYTHONPATH: `${root}:${backend}`,
      NEXTROUTER_ENV_FILE: `${root}/empty.env`, DATABASE_URL: `sqlite:///${root}/db.sqlite3`,
      PRIVATE_DOCUMENT_ROOT: `${root}/private`, MEDIA_ROOT: `${root}/media`, NEXTROUTER_LAN_HOST: '',
      REDIS_URL: '', OSRM_URL: '', GEOCODING_URL: '', EMAIL_HOST: '', CLOUDINARY_URL: '',
      FRONTEND_URL: origin, FIXTURE_PASSWORD: password,
      SECRET_KEY: randomBytes(32).toString('hex'), PYTHONDONTWRITEBYTECODE: '1',
      FRONTEND_REVISION: frontendRevision, BACKEND_REVISION: backendRevision,
      SMOKE_ROOT: root,
    }
    await mkdir(`${root}/private`, { mode: 0o700 })
    // Overlay só do harness: nenhum arquivo app/settings ou diretório habitual é alterado.
    await writeFile(`${root}/nr_vue_smoke_settings.py`, `
from app.settings.dev import *
from pathlib import Path
import os
FRONTEND_DIST = Path(os.environ['SMOKE_ROOT']) / 'release' / 'frontend_dist'
MEDIA_ROOT = str(Path(os.environ['SMOKE_ROOT']) / 'media')
`)
    const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', `${root}/dist`, '--logLevel', 'error'], {
      cwd: frontend, encoding: 'utf8', timeout: 120000,
    })
    assert.equal(build.status, 0, 'Build Vue falhou (nenhum dist habitual foi sobreposto).')
    const setup = spawnSync(python, ['-'], { cwd: backend, env, encoding: 'utf8', timeout: 120000, input: `
import io, json, os, django
from pathlib import Path
from shared.frontend_artifact import prepare_artifact, verify_artifact
root = Path(os.environ['SMOKE_ROOT'])
prepare_artifact(source=root/'dist', destination=root/'release', frontend_revision=os.environ['FRONTEND_REVISION'], backend_revision=os.environ['BACKEND_REVISION'])
verify_artifact(root/'release'/'frontend_dist', expected_backend_revision=os.environ['BACKEND_REVISION'])
django.setup()
from django.core.management import call_command
from modules.accounts.models import User
from modules.organizations.models import Company, Passenger
call_command('migrate', interactive=False, verbosity=0, stdout=io.StringIO())
passenger_user = User.objects.create_user(email='passenger@fixture.example.invalid', password=os.environ['FIXTURE_PASSWORD'], name='Passageiro Fictício', cpf='00000000000')
Passenger.objects.create(user=passenger_user)
company_user = User.objects.create_user(email='company@fixture.example.invalid', password=os.environ['FIXTURE_PASSWORD'], name='Empresa Fictícia', cpf='00000000001')
Company.objects.create(user=company_user, trade_name='Transporte Fictício', legal_name='Empresa Fictícia', cnpj='00000000000000', state_registration='FICTICIA', is_approved=True)
print(json.dumps({'company_user_id':str(company_user.pk)}))
` })
    assert.equal(setup.status, 0, 'Preparação isolada falhou; nenhum banco habitual foi usado.')
    const fixture = JSON.parse(setup.stdout.trim())
    launch(python, ['-m', 'daphne', '-b', '127.0.0.1', '-p', String(port), '--access-log', '/dev/null', 'app.asgi:application'], env)
    await waitFor(async () => (await fetch(`${origin}/health/live/`)).ok, 'Django ASGI')
    // Checagem da entrega real e dos limites, não apenas da fixture HTML histórica.
    for (const path of ['/', '/usuario']) {
      const response = await fetch(`${origin}${path}`, { headers: { Accept: 'text/html' } })
      assert.equal(response.status, 200)
      assert.equal(response.headers.get('cache-control'), 'no-cache')
      assert.match(await response.text(), /\/assets\/index-/)
    }
    for (const path of ['/api/nao-existe/', '/assets/nao-existe.js', '/sw.js', '/manifest.webmanifest', '/frontend-release.json']) {
      assert.equal((await fetch(`${origin}${path}`)).status, 404)
    }

    stage = 'Firefox e isolamento de rede'
    await mkdir(`${root}/firefox`)
    // Impede saída à Internet inclusive antes de conectar o BiDi. Loopback é a única exceção.
    const blockedProxy = await freePort()
    await writeFile(`${root}/firefox/user.js`, [
      'user_pref("network.proxy.type", 1);',
      'user_pref("network.proxy.http", "127.0.0.1");',
      `user_pref("network.proxy.http_port", ${blockedProxy});`,
      'user_pref("network.proxy.ssl", "127.0.0.1");',
      `user_pref("network.proxy.ssl_port", ${blockedProxy});`,
      'user_pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");',
      'user_pref("network.dns.disablePrefetch", true);',
      'user_pref("network.prefetch-next", false);',
      'user_pref("network.cookie.cookieBehavior", 1);',
    ].join('\n'))
    const debuggingPort = await freePort()
    const firefox = launch('firefox', ['--headless', '--no-remote', '--profile', `${root}/firefox`, '--remote-debugging-port', String(debuggingPort)], env)
    let announced = false
    firefox.stderr.on('data', (data) => { if (data.toString().includes('WebDriver BiDi listening')) announced = true })
    await waitFor(() => announced, 'Firefox BiDi')
    transport = new WebSocket(`ws://127.0.0.1:${debuggingPort}/session`)
    await once(transport, 'open')
    let sequence = 0
    const pending = new Map()
    const responses = []
    const command = (method, params) => new Promise((done, reject) => {
      const id = ++sequence
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout BiDi: ${method}`)) }, 25000)
      pending.set(id, {
        resolve: (value) => { clearTimeout(timer); done(value) },
        reject: (error) => { clearTimeout(timer); reject(error) },
      })
      transport.send(JSON.stringify({ id, method, params }))
    })
    transport.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data)
      if (message.method === 'network.beforeRequestSent' && message.params.isBlocked) {
        const request = message.params.request
        const allowed = new URL(request.url).origin === origin
        command(allowed ? 'network.continueRequest' : 'network.failRequest', { request: request.request }).catch(() => {})
      }
      if (message.method === 'network.responseCompleted') {
        const { request, response, context } = message.params
        const url = new URL(request.url)
        if (url.origin === origin && url.pathname.startsWith('/api/')) responses.push({ path: url.pathname, method: request.method, status: response.status, context })
      }
      const callback = pending.get(message.id)
      if (!callback) return
      pending.delete(message.id)
      if (message.type === 'error') callback.reject(new Error(`BiDi: ${message.error}`))
      else callback.resolve(message.result)
    })
    transport.addEventListener('close', () => {
      for (const callback of pending.values()) callback.reject(new Error('Smoke encerrado.'))
      pending.clear()
    })
    await command('session.new', { capabilities: {} })
    await command('session.subscribe', { events: ['network.beforeRequestSent', 'network.responseCompleted'] })
    await command('network.addIntercept', { phases: ['beforeRequestSent'] })
    await command('script.addPreloadScript', { functionDeclaration: `() => {
      window.__sessionEvidence = {
        bearer: sessionStorage.getItem('__smoke_bearer') === 'true',
        jwtInJson: sessionStorage.getItem('__smoke_jwt') === 'true'
      };
      const open = XMLHttpRequest.prototype.open;
      const header = XMLHttpRequest.prototype.setRequestHeader;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this.addEventListener('loadend', () => {
          if (new URL(url, location.href).pathname === '/api/login/' && this.status === 200) {
            const data = JSON.parse(this.responseText);
            window.__sessionEvidence.jwtInJson ||= 'access' in data || 'refresh' in data;
            sessionStorage.setItem('__smoke_jwt', String(window.__sessionEvidence.jwtInJson));
          }
        });
        return open.call(this, method, url, ...rest);
      };
      XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        if (name.toLowerCase() === 'authorization') {
          window.__sessionEvidence.bearer = true;
          sessionStorage.setItem('__smoke_bearer', 'true');
        }
        return header.call(this, name, value);
      };
    }` })
    const evaluate = async (context, expression) => {
      const result = await command('script.evaluate', { expression, target: { context }, awaitPromise: true, resultOwnership: 'none' })
      if (result.type !== 'success') throw new Error('Exceção no script do smoke; valores privados não são registrados.')
      return result.result.value
    }
    const navigate = async (context, path) => {
      await command('browsingContext.navigate', { context, url: `${origin}${path}`, wait: 'complete' })
    }
    const logged = (context) => waitFor(() => evaluate(context, 'Boolean(document.querySelector(".top-bar-user-btn"))'), 'Vue autenticado')
    const login = async (role) => {
      const { userContext } = await command('browser.createUserContext', {})
      const { context } = await command('browsingContext.create', { type: 'tab', userContext })
      await navigate(context, '/login')
      await waitFor(() => evaluate(context, 'Boolean(document.querySelector(".login-submit"))'), 'formulário Vue')
      await evaluate(context, `(() => {
        for (const [selector, value] of [['input[type=email]', ${JSON.stringify(`${role}@fixture.example.invalid`)}], ['input[type=password]', ${JSON.stringify(password)}]]) {
          const input = document.querySelector(selector); input.value = value; input.dispatchEvent(new Event('input', {bubbles:true}));
        }
        document.querySelector('.login-submit').click(); return true;
      })()`)
      await logged(context)
      return { context, userContext }
    }

    stage = 'login, cookies e perfis isolados'
    const company = await login('company')
    const passenger = await login('passenger')
    assert.equal(await evaluate(company.context, 'document.body.textContent.includes("Usuários")'), true)
    assert.equal(await evaluate(passenger.context, 'document.body.textContent.includes("Usuários")'), false)
    for (const account of [company, passenger]) {
      const { cookies } = await command('storage.getCookies', { partition: { type: 'context', context: account.context } })
      assert.equal(cookies.filter((cookie) => ['access_token', 'refresh_token'].includes(cookie.name) && cookie.httpOnly).length, 2)
      assert.equal(await evaluate(account.context, 'document.cookie.includes("access_token") || document.cookie.includes("refresh_token")'), false)
      assert.equal(await evaluate(account.context, 'window.__sessionEvidence.bearer || window.__sessionEvidence.jwtInJson'), false)
      assert.equal(await evaluate(account.context, 'localStorage.getItem("access") !== null || localStorage.getItem("user") !== null || sessionStorage.getItem("access") !== null || sessionStorage.getItem("user") !== null'), false)
    }
    await navigate(passenger.context, '/usuario')
    await logged(passenger.context)
    assert.equal(await evaluate(passenger.context, `fetch('/api/users/me/').then(r => r.json()).then(u => u.email === 'passenger@fixture.example.invalid')`), true)
    // /users/{id}/ é restrito ao admin, ao contrário dos recursos de domínio invisíveis (404).
    assert.equal(await evaluate(passenger.context, `fetch('/api/users/${fixture.company_user_id}/').then(r => r.status)`), 403)
    assert.equal(await evaluate(passenger.context, `fetch('/api/memberships/', {method:'POST', headers:{'Content-Type':'application/json'}, body:'{}'}).then(r => r.status)`), 403)

    stage = 'retirada do legado, expiração e refresh entre abas'
    await evaluate(passenger.context, `(() => { localStorage.setItem('access', 'legado-ficticio'); localStorage.setItem('user', '{invalido'); return true; })()`)
    await navigate(passenger.context, '/usuario')
    await logged(passenger.context)
    assert.equal(await evaluate(passenger.context, 'localStorage.getItem("access") === null && localStorage.getItem("user") === null'), true)
    const { context: otherTab } = await command('browsingContext.create', { type: 'tab', userContext: passenger.userContext })
    await navigate(otherTab, '/usuario')
    await logged(otherTab)
    const countRefresh = () => responses.filter((response) => response.path === '/api/refresh/' && response.method === 'POST').length
    const before = countRefresh()
    await command('storage.deleteCookies', { filter: { name: 'access_token' }, partition: { type: 'context', context: passenger.context } })
    await Promise.all([navigate(passenger.context, '/usuario'), navigate(otherTab, '/usuario')])
    await Promise.all([logged(passenger.context), logged(otherTab)])
    assert.equal(countRefresh() - before, 1, 'Renovação deve ser única entre abas com os mesmos cookies.')
    assert.equal(responses.some((response) => response.path === '/api/refresh/' && response.method === 'POST' && response.status === 200), true)

    stage = 'logout real e revogação entre abas'
    await navigate(passenger.context, '/seguranca')
    await waitFor(() => evaluate(passenger.context, 'Boolean(document.querySelector(".logout-action-btn"))'), 'botão de logout')
    await evaluate(passenger.context, 'document.querySelector(".logout-action-btn").click()')
    for (const context of [passenger.context, otherTab]) {
      await waitFor(() => evaluate(context, 'Boolean(document.querySelector(".login-submit"))'), 'logout no Vue e outra aba')
      assert.equal(await evaluate(context, `fetch('/api/users/me/').then(r => r.status)`), 401)
    }
    assert.equal(await evaluate(company.context, `fetch('/api/users/me/').then(r => r.json()).then(u => u.email === 'company@fixture.example.invalid')`), true)
    assert.equal(await evaluate(company.context, 'navigator.serviceWorker.getRegistrations().then(items => items.length)'), 0)
    success = true
  } catch (error) {
    console.error(`Smoke Vue falhou em ${stage}: ${error.message}`)
    process.exitCode = 1
  } finally {
    transport?.close()
    for (const child of children.reverse()) await stopChild(child)
    await rm(root, { recursive: true, force: true })
  }
  if (success) console.log(`Smoke Vue/Django/Firefox aprovado: login/recarga, cookies HttpOnly, CSRF, perfis isolados, refresh entre abas e logout. Frontend ${frontendRevision}, backend ${backendRevision}. Recursos próprios removidos; sem TLS/WS/viagens/Marco A completo.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
