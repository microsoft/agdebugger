import asyncio
import pickle
import webbrowser

import typer
import uvicorn
from typing_extensions import Annotated

from .app import get_server

cli_app = typer.Typer()


@cli_app.command()
def run(
    module: str,
    host: str = "127.0.0.1",
    port: int = 8081,
    workers: int = 1,
    reload: Annotated[bool, typer.Option("--reload")] = False,
    launch: Annotated[bool, typer.Option("--launch")] = False,
    history: str | None = None,
    cache: str | None = None,
):
    """
    Run the AGEDebugger app.

    Args:
        module (str): description of agent app loader
        host (str, optional): Host to run the UI on. Defaults to 127.0.0.1 (localhost).
        port (int, optional): Port to run the UI on. Defaults to 8081.
        workers (int, optional): Number of workers to run the UI with. Defaults to 1.
        reload (bool, optional): Whether to reload the UI on code changes. Defaults to False.
        open (bool, optional): Whether to open the UI in the browser. Defaults to False.
        history (str, optional): Path to a history file to load.
        cache (str, optional): Path to a cache file to load.
        scorer (str, optional): name of score function
    """
    loaded_history = None
    loaded_cache = None
    if history is not None:
        with open(history, "rb") as f:
            loaded_history = pickle.load(f)

    if cache is not None:
        with open(cache, "rb") as f:
            loaded_cache = pickle.load(f)

    if launch:
        webbrowser.open(f"http://{host}:{port}")

    asyncio.run(async_run(module, loaded_history, loaded_cache, host, port, workers, reload))


async def async_run(module, loaded_history, loaded_cache, host, port, workers, reload):
    server_app = await get_server(module, loaded_history, loaded_cache)

    config = uvicorn.Config(
        server_app,
        host=host,
        port=port,
        workers=workers,
        reload=reload,
    )
    server = uvicorn.Server(config)

    print("Starting server...")
    await server.serve()


def main_cli():
    cli_app()
