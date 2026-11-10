# xpensiv-mcp

Your AI wrote the app. Xpensiv makes it sexy.

Xpensiv is the Vertical Foundation Model (VFM) for Design, the Anti AI-Slop Model. It is API and MCP first, so a developer's AI agent calls it on an app it built and asks, design first, what to change.

This package is the Xpensiv MCP server. It runs locally over stdio and calls the Xpensiv REST API at https://xpensiv.si.

## Install

Node 18 or newer.

```
npx -y xpensiv-mcp
```

Set `XPENSIV_API_KEY` to a key from https://xpensiv.si/console/keys. The key is shown once and starts with `xpk_`. Do not commit it. `XPENSIV_API_URL` overrides the host.

Example client config:

```json
{
  "mcpServers": {
    "xpensiv": {
      "command": "npx",
      "args": ["-y", "xpensiv-mcp"],
      "env": { "XPENSIV_API_KEY": "xpk_..." }
    }
  }
}
```

## Tools

- `check_app`: start a design check on a public URL. Returns a check ID.
- `get_check`: read the status and the fix list for a check ID. A check takes 1 to 3 minutes.
- `list_checks`: list your recent checks.

## Hosted server

The hosted Streamable HTTP server is `POST https://xpensiv.si/mcp` with `Authorization: Bearer xpk_...`.

## How a check works

The hosted service sends screenshots of the page to a vision model and returns findings next to browser measurements. If the model is unavailable, the result says it fell back to automated findings only. A check covers one page, without clicks, forms or signed-in flows. Read the findings before you change anything.

## Develop

```
npm test
```

## Licence

MIT. Copyright Xpensiv SI. Website: https://xpensiv.si
