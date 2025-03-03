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

Later can just launch dev server

```sh
cd frontend
npm run dev
```
