import pickle

import aiofiles
from autogen_core import SingleThreadedAgentRuntime

from .intervention import AgDebuggerInterventionHandler

#### utils for running intervention handler from python script
STATE_CACHE = {}


async def save_agent_state_to_cache(runtime: SingleThreadedAgentRuntime, timestep: int) -> None:
    checkpoint = await runtime.save_state()
    STATE_CACHE[timestep] = checkpoint


async def write_cache_and_history(ihandler: AgDebuggerInterventionHandler) -> None:
    # run_id = int(time.time())
    run_id = ""

    hist_path = f"history{run_id}.pickle"
    cache_path = f"cache{run_id}.pickle"

    await write_file_async(hist_path, ihandler.history)
    await write_file_async(cache_path, STATE_CACHE)

    print("Saved AgDebugger cache files to: ", [hist_path, cache_path])


async def write_file_async(path, data):
    async with aiofiles.open(path, "wb") as f:
        buffer = pickle.dumps(data)
        await f.write(buffer)
