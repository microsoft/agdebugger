import asyncio

from autogen_agentchat.conditions import MaxMessageTermination
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient
from local_agent import LocalAgent


async def get_agent_team():
    model_client = OpenAIChatCompletionClient(model="gpt-4o")

    agent1 = LocalAgent("LOCAL_AGENT_1", model_client=model_client)
    agent2 = LocalAgent("LOCAL_AGENT_2", model_client=model_client)
    termination = MaxMessageTermination(10)
    team = RoundRobinGroupChat([agent1, agent2], termination_condition=termination)

    return team


async def main() -> None:
    team = await get_agent_team()

    result = await team.run(task="0")
    print("\n\nFINAL RESULT", result)


if __name__ == "__main__":
    asyncio.run(main())
