# AGDebugger

AGDebugger helps you debug your agent workflows. It lets you interactively visualize agent conversations and provides interactions to edit conversations and agent configurations across histories.

## Local Install

AGDebugger is not yet available as a pip package. You can install it locally by cloning the repo and installing the python package.

NOTE: Do not pip install -e . for the last step or else it cant find the frontend files!

```sh
cd frontend
npm install
npm run build
cd ..
pip install .
```

## Usage

To use `agdebugger`, you should author a file which exposes an AgentGroupchat that includes all of the agents in your system. You should then call `agdebugger` and pass the module and variable name in that module that contains the SingleThreadedAgentRuntime.

```sh
agdebugger MODULE:VARIABLE
```

For example:

```sh
 agdebugger scenario:get_agent_team
```

# Development

## Backend

```sh
# Install editable
pip install -e .

AGDEBUGGER_BACKEND_SERVE_UI=FALSE agdebugger scenario:get_agent_team --port 8123
```

## Frontend

First time

```sh
cd frontend
# Create a .env.development.local file with the required API URL
echo "VITE_AGDEBUGGER_FRONTEND_API_URL=http://localhost:8123/api" > .env.development.local
npm install
```

Later

```sh
cd frontend
npm run dev
```
