#!/usr/bin/env node
// Xpensiv stdio MCP server (newline-delimited JSON-RPC 2.0). No dependencies.
// Env: XPENSIV_API_KEY (required), XPENSIV_API_URL (default https://xpensiv.si).
import { createInterface } from 'node:readline'
const BASE = (process.env.XPENSIV_API_URL || 'https://xpensiv.si').replace(/\/$/, '')
const KEY = process.env.XPENSIV_API_KEY || ''
const VERSION = '0.1.1'
const TOOLS = [
  { name: 'check_app', description: 'Start an Xpensiv design check on a public http(s) URL. Returns a check id; then call get_check.', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
  { name: 'get_check', description: 'Get a check by id: status, and the fix list with screenshots once completed. Checks take 1 to 3 minutes.', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'list_checks', description: 'List your recent checks.', inputSchema: { type: 'object', properties: {} } },
]
const send = m => process.stdout.write(JSON.stringify(m) + '\n')
async function api(path, init = {}) {
  if (!KEY) throw new Error('XPENSIV_API_KEY is not set. Create a key at ' + BASE + '/console/keys')
  const r = await fetch(BASE + path, { ...init, headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'User-Agent': `xpensiv-mcp/${VERSION} (${clientName || 'unknown'})` } })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${r.status}: ${body.error || r.statusText}${body.upgrade ? ' Upgrade: ' + BASE + body.upgrade : ''}`)
  return body
}
let clientName = ''
async function call(name, args) {
  if (name === 'check_app') return api('/api/v1/checks', { method: 'POST', body: JSON.stringify({ url: String(args?.url || '') }) })
  if (name === 'get_check') { const id = encodeURIComponent(String(args?.id || '')); return api(`/api/v1/checks/${id}`) }
  if (name === 'list_checks') return api('/api/v1/checks')
  throw new Error('Unknown tool: ' + name)
}
const rl = createInterface({ input: process.stdin })
rl.on('line', async line => {
  if (!line.trim()) return
  let m; try { m = JSON.parse(line) } catch { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) }
  const { id, method, params } = m
  if (id === undefined) return // notification
  try {
    if (method === 'initialize') { clientName = String(params?.clientInfo?.name || ''); return send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'xpensiv', version: VERSION } } }) }
    if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} })
    if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    if (method === 'tools/call') {
      try { const out = await call(params?.name, params?.arguments); return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] } }) }
      catch (e) { return send({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } }) }
    }
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } })
  } catch (e) { send({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } }) }
})
