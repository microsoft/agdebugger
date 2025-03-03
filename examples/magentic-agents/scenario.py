import asyncio

from autogen_agentchat.teams import MagenticOneGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.agents.web_surfer import MultimodalWebSurfer
from autogen_ext.models.openai import OpenAIChatCompletionClient


async def get_agent_team():
    model_client = OpenAIChatCompletionClient(model="gpt-4o")

    surfer = MultimodalWebSurfer(
        "WebSurfer",
        model_client=model_client,
    )
    team = MagenticOneGroupChat([surfer], model_client=model_client)

    return team


async def main() -> None:
    team = await get_agent_team()

    await Console(team.run_stream(task="What is the weather in Seattle?"))


if __name__ == "__main__":
    asyncio.run(main())
