import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
function rpc(messages) {
  const result = spawnSync(process.execPath, ['bin/xpensiv-mcp.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { PATH: process.env.PATH, XPENSIV_API_KEY: '' },
    input: messages.map(m => JSON.stringify(m)).join('\n') + '\n', encoding: 'utf8', timeout: 5000,
  })
  assert.equal(result.status, 0)
  return result.stdout.trim().split('\n').map(line => JSON.parse(line))
}

test('stdio initialization reports the package version and live tools', () => {
  const replies = rpc([{ id: 1, method: 'initialize' }, { id: 2, method: 'tools/list' }])
  assert.equal(replies[0].result.serverInfo.version, pkg.version)
  assert.deepEqual(replies[1].result.tools.map(t => t.name), ['check_app', 'get_check', 'list_checks'])
})

test('API calls without a key return a tool error without network access', () => {
  const [reply] = rpc([{ id: 1, method: 'tools/call', params: { name: 'list_checks' } }])
  assert.equal(reply.result.isError, true)
  assert.match(reply.result.content[0].text, /XPENSIV_API_KEY is not set/)
})

test('registry manifest matches the release and requires a secret API key', () => {
  const server = JSON.parse(readFileSync(new URL('../server.json', import.meta.url)))
  assert.equal(server.name, pkg.mcpName)
  assert.equal(server.version, pkg.version)
  assert.equal(server.packages[0].identifier, pkg.name)
  assert.equal(server.packages[0].version, pkg.version)
  assert.equal(server.packages[0].transport.type, 'stdio')
  assert.deepEqual(server.packages[0].environment_variables.map(v => [v.name, v.is_secret, v.is_required]), [['XPENSIV_API_KEY', true, true]])
})
