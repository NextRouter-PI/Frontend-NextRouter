import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('smoke Vue recusa execução sem confirmação fictícia antes de preparar recursos', () => {
  const script = fileURLToPath(new URL('../scripts/test_django_browser.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 10000 })
  assert.ifError(result.error)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Exige --confirm-fictitious/)
})
