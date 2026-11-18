import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
import test from 'node:test'

test('smoke Vue recusa execução sem confirmação fictícia antes de preparar recursos', () => {
  const result = spawnSync(process.execPath, ['scripts/test_django_browser.mjs'], { encoding: 'utf8' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Exige --confirm-fictitious/)
})
