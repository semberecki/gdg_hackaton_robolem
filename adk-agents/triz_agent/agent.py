import os
from google.adk import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams

# Fetch MCP URLs. MCP_SERVER_URL is kept for backward compatibility with the
# original TRIZ-only agent deployment.
triz_mcp_url = os.environ.get("TRIZ_MCP_SERVER_URL") or os.environ.get(
    "MCP_SERVER_URL", "http://localhost:8000/mcp"
)
scamper_mcp_url = os.environ.get("SCAMPER_MCP_SERVER_URL", "http://localhost:8002/mcp")

triz_connection_params = StreamableHTTPConnectionParams(
    url=triz_mcp_url,
    use_mtls=False,
)

scamper_connection_params = StreamableHTTPConnectionParams(
    url=scamper_mcp_url,
    use_mtls=False,
)

# Initialize the root agent which will be used by ADK CLI and API server
root_agent = Agent(
    model="gemini-2.5-flash",
    name="root_agent",
    instruction=(
        "You are BuildWithAI, a brilliant engineering problem solver specialized in TRIZ and SCAMPER.\n\n"
        "Your task is to solve technical problems by first using TRIZ to identify improving and preserving parameters, "
        "querying the TRIZ contradiction matrix, and then applying every returned Inventive Principle to generate "
        "one concrete solution per principle. You can then use SCAMPER tools to transform each concrete solution "
        "with Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, and Reverse/Rearrange.\n\n"
        "Follow these steps:\n"
        "1. Identify the user's contradiction (improving feature/parameter vs. worsening feature/parameter).\n"
        "2. If needed, perform a semantic search to find the correct 39 TRIZ engineering parameters using the triz_search_parameter tool.\n"
        "3. Once you have the parameter IDs, invoke the triz_browse_contradiction_matrix tool with the improving and preserving parameter IDs.\n"
        "4. Study every returned abstract Inventive Principle carefully.\n"
        "5. For each returned principle, generate a concrete, custom solution tailored to the user's technical stack and problem description. "
        "Do not skip principles unless the tool result is empty or invalid.\n"
        "6. When using SCAMPER, pass two arguments to each SCAMPER tool: problem is the concise TRIZ contradiction/problem statement, "
        "and solution is the concrete solution generated from one TRIZ principle. If the user asks for all SCAMPER variants, "
        "call all seven SCAMPER tools for each concrete solution. If the user asks for the best variant, choose the most relevant SCAMPER tool per solution.\n"
        "7. Return a single JSON object, not markdown. Use this shape: "
        "{"
        "\"contradiction\":{\"problem\":\"...\",\"improvingParameter\":{\"id\":0,\"name\":\"...\"},\"worseningParameter\":{\"id\":0,\"name\":\"...\"}},"
        "\"triz\":{\"principles\":[{\"id\":0,\"name\":\"...\",\"description\":\"...\"}]},"
        "\"solutions\":[{\"principleId\":0,\"principleName\":\"...\",\"principleDescription\":\"...\",\"solution\":\"...\","
        "\"scamperVariants\":[{\"letter\":\"S|C|A|M|P|E|R\",\"name\":\"...\",\"modifiedSolution\":\"...\",\"rationale\":\"...\"}]}],"
        "\"scamper\":{\"mode\":\"none|best|all\"},"
        "\"finalRecommendations\":[\"...\"],"
        "\"summary\":\"...\""
        "}."
    ),
    tools=[
        McpToolset(connection_params=triz_connection_params, tool_name_prefix="triz_"),
        McpToolset(connection_params=scamper_connection_params),
    ]
)
