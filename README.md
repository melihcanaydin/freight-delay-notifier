# Freight Delivery Delay Notification System

## Overview

This system monitors freight delivery routes for traffic delays and notifies customers if a significant delay occurs. It uses Temporal for workflow orchestration, integrates with real APIs for traffic data, AI-generated messages, and email notifications. The application is fully containerized with Docker.

## Features

- Monitors delivery routes for traffic delays using OpenRouteService
- Calculates delay and checks against a configurable threshold
- Generates friendly delay messages using OpenAI GPT-4o-mini
- Sends notifications to customers via email using SendGrid
- Orchestrates all steps with Temporal workflows
- Structured logging and robust error handling

## Prerequisites

- Docker and Docker Compose installed
- API keys for OpenAI, SendGrid, and OpenRouteService

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable                | Description                       | Required | Default |
| ----------------------- | --------------------------------- | -------- | ------- |
| OPENAI_API_KEY          | OpenAI API key for GPT-4o-mini    | Yes      |         |
| SENDGRID_API_KEY        | SendGrid API key for email        | Yes      |         |
| ORS_API_KEY             | OpenRouteService API key          | Yes      |         |
| PORT                    | Application port                  | No       | 3000    |
| DELAY_THRESHOLD_MINUTES | Delay threshold for notifications | No       | 10      |

## Setup

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd LEVITY
   ```
2. Create a `.env` file and fill in your API keys as shown above.

## Running with Docker

Start the entire stack, including the Temporal server and PostgreSQL, using Docker Compose:

```bash
docker-compose up --build
```

This will start the following services:

- freight-delay-monitor-app: Main application and Temporal worker
- freight-delay-temporal-server: Temporal server
- freight-delay-postgres-db: PostgreSQL database for Temporal

## Triggering the Workflow

To trigger the freight delay workflow, run the workflow trigger script inside the running app container:

1. Open a new terminal window.
2. Find the running app container name:
   ```bash
   docker ps
   ```
   Look for `freight-delay-monitor-app` in the list.
3. Execute the workflow trigger script:
   ```bash
   docker exec -it freight-delay-monitor-app npm run build
   docker exec -it freight-delay-monitor-app node dist/workflows/triggerWorkflow.js
   ```
   This will start a workflow with sample data. You can modify the input in `src/workflows/triggerWorkflow.ts` if you want to test with different routes or contacts.

## Testing

Unit tests are provided for core services. To run tests:

```bash
docker-compose run --rm freight-delay-monitor npm test
```

This will execute the test suite, including:

- AI message generation and fallback logic
- You can add more tests for other services and activities

## Logging

The application uses structured logging for all key steps, including:

- Traffic delay calculation
- AI message generation
- Notification sending
- Workflow execution and errors

Logs are output to the console in JSON format for easy parsing and debugging.

## Project Structure

```
LEVITY/
├── src/
│   ├── activities/
│   ├── workflows/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── config/
│   └── main.ts
├── .env
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

## Notes

- The workflow can be customized by editing `src/workflows/triggerWorkflow.ts`.
- All API integrations have retry logic and fallback handling.
- Logs and errors are visible in the Docker Compose output.
