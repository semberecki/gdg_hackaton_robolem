# SCAMPER MCP Server

A Model Context Protocol (MCP) server exposing SCAMPER transformation tools over Streamable HTTP.

Each tool accepts a single `problem: str` argument and returns a JSON string describing the transformed solution direction, focus questions, and implementation directive.

## Tools

- `scamper_substitute`
- `scamper_combine`
- `scamper_adapt`
- `scamper_modify`
- `scamper_put_to_another_use`
- `scamper_eliminate`
- `scamper_reverse`

## Run locally with uv

```bash
cp ../.env.example .env
uv sync
uv run python app/main.py
```

The server listens on `http://localhost:8000` by default. Configure `MCP_HOST` and `MCP_PORT` through `.env`.

## Run with Docker

From this directory:

```bash
docker build -t scamper-mcp-server .
docker run --rm -p 8000:8000 --env-file ../.env scamper-mcp-server
```

## Test with MCP Inspector

With the server running (locally or via Docker), launch the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
npx @modelcontextprotocol/inspector
```

In the Inspector UI, connect using:

- **Transport:** Streamable HTTP
- **URL:** `http://localhost:8000/mcp`

You should see the registered SCAMPER tools and can invoke them directly from the UI.
