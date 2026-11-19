// Build de trabalho para o Django; não cria identidade/manifesto de release.
import { lstat, mkdtemp, readdir, rename, rm } from 'node:fs/promises'
import { extname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const backend = fileURLToPath(new URL('../../backend', import.meta.url))
const destination = join(backend, 'frontend_dist')
// Mesmo conjunto público de backend/shared/frontend_artifact.py.
const extensions = new Set([
  '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif',
  '.ico', '.woff', '.woff2', '.ttf', '.eot', '.wasm',
])

async function statOrMissing(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

// Recusar conteúdo inesperado em vez de apagar uma pasta arbitrária ou seguir links.
async function assertArtifact(root, allowEmpty = false) {
  const stat = await lstat(root)
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Artefato deve ser um diretório real: ${root}`)
  }
  if (allowEmpty && (await readdir(root)).length === 0) return
  async function visit(directory, insideAssets = false) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.name.startsWith('.') || /[\\\x00-\x1f]/.test(entry.name)) {
        throw new Error(`Caminho não autorizado no artefato: ${path}`)
      }
      if (entry.isDirectory() && (insideAssets || entry.name === 'assets')) {
        await visit(path, true)
      } else if (!entry.isFile() || !(insideAssets
        ? extensions.has(extname(entry.name).toLowerCase())
        : ['index.html', 'favicon.ico'].includes(entry.name))) {
        throw new Error(`Conteúdo não reconhecido como gerado; nada será substituído: ${path}`)
      }
    }
  }
  await visit(root)
  if (!(await statOrMissing(join(root, 'index.html')))?.isFile()
    || !(await statOrMissing(join(root, 'assets')))?.isDirectory()) {
    throw new Error('O artefato precisa conter index.html e assets/.')
  }
}

async function main() {
  if (!(await lstat(backend)).isDirectory() || !(await lstat(join(backend, 'manage.py'))).isFile()) {
    throw new Error('O comando requer o repositório backend/ ao lado de frontend/.')
  }
  if (await statOrMissing(destination)) await assertArtifact(destination, true)
  const staging = await mkdtemp(join(backend, '.frontend-build-'))
  const next = join(staging, 'next')
  const previous = join(staging, 'previous')
  let hasPrevious = false
  try {
    // Compilar antes de tocar na versão instalada. Não exige Git limpo ou Python.
    await build({ root: frontend, build: { outDir: next, emptyOutDir: true } })
    await assertArtifact(next)
    if (await statOrMissing(destination)) {
      await assertArtifact(destination, true)
      await rename(destination, previous)
      hasPrevious = true
    }
    try {
      await rename(next, destination)
    } catch (error) {
      if (hasPrevious) {
        await rename(previous, destination)
        hasPrevious = false
      }
      throw error
    }
    // A pasta anterior foi reconhecida como artefato; nenhum banco/mídia é tocado.
    await rm(previous, { recursive: true, force: true })
    hasPrevious = false
    console.log('Vue atualizado em backend/frontend_dist/. Reinicie o Django para carregar os novos assets.')
    console.log('Build de trabalho: frontend-release.json não é criado nem atualizado.')
  } finally {
    if (hasPrevious) {
      console.error(`Artefato anterior preservado em ${previous}; confira-o antes de qualquer limpeza.`)
    } else {
      await rm(staging, { recursive: true, force: true })
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(`Build para o backend interrompido: ${error.message}`)
  process.exitCode = 1
}
