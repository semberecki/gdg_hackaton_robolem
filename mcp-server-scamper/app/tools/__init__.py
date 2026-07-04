from mcp.server.fastmcp import FastMCP

from app.tools.scamper import (
    scamper_adapt,
    scamper_combine,
    scamper_eliminate,
    scamper_modify,
    scamper_put_to_another_use,
    scamper_reverse,
    scamper_substitute,
)

tools = [
    scamper_substitute,
    scamper_combine,
    scamper_adapt,
    scamper_modify,
    scamper_put_to_another_use,
    scamper_eliminate,
    scamper_reverse,
]


def register(mcp: FastMCP) -> None:
    for tool in tools:
        mcp.tool()(tool)
