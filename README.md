# Claude Transcript Viewer

A web application for viewing and analyzing Claude conversation transcripts stored in AWS S3. The application provides a user-friendly interface to browse sessions, view detailed conversation transcripts, and analyze subagent interactions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Running the Application](#running-the-application)
  - [Docker (Production)](#docker-production)
  - [Docker (Development)](#docker-development)
  - [Local Development](#local-development)
- [S3 Structure](#s3-structure)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Project Structure](#project-structure)

## Overview

Claude Transcript Viewer is designed to work with AWS S3-stored conversation transcripts. It automatically discovers sessions from S3 bucket listings and displays them in a browsable format with support for:

- Session listing and filtering
- Detailed transcript viewing
- Subagent interaction analysis
- Real-time statistics and metrics

## Features

- **Session Management**: Browse and filter conversation sessions
- **Transcript Viewing**: View detailed conversation transcripts with rich formatting
- **Subagent Analysis**: Analyze subagent interactions and tool usage
- **AWS S3 Integration**: Direct integration with S3 for transcript storage
- **Docker Support**: Production-ready Docker deployment
- **Health Monitoring**: Built-in health check endpoint

## Architecture

The application consists of two main components:

1. **Backend (Express + TypeScript)**: REST API server that interfaces with AWS S3
2. **Frontend (React + Vite)**: User interface for viewing and analyzing transcripts

In production, both components are bundled into a single Docker image where the backend serves the frontend static files.

## Tech Stack

### Backend
- Node.js 20+
- Express.js
- TypeScript
- AWS SDK v3 (@aws-sdk/client-s3)
- Jest (testing)

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Vitest (testing)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (for containerized deployment)
- AWS S3 bucket with transcripts
- AWS credentials or EC2 Instance Profile (for S3 access)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd claude-transcript-viewer

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:
```bash
# Backend Configuration
PORT=3000
NODE_ENV=production

# AWS S3 Configuration
TRANSCRIPT_BUCKET=your-bucket-name
AWS_REGION=ap-northeast-2

# Frontend Configuration (for local development only)
VITE_API_URL=http://localhost:3000
```

**Note**: When running on EC2 with an Instance Profile, you don't need to provide AWS credentials. The application will automatically use the instance's IAM role.

## Running the Application

### Docker (Production)

The recommended way to run in production is using Docker:

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

The application will be available at `http://localhost:3000`

### Docker (Development)

For development with hot-reload:

```bash
# Start development services
docker-compose --profile dev up

# Backend will run on: http://localhost:3001
# Frontend will run on: http://localhost:5173
```

### Local Development

```bash
# Start both backend and frontend in development mode
npm run dev

# Or start them separately:
npm run dev:backend  # Runs on port 3001
npm run dev:frontend # Runs on port 5173
```

Development URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## S3 Structure

The application expects transcripts to be stored in S3 with the following structure:

```
s3://${TRANSCRIPT_BUCKET}/
├── {session_id}.jsonl                                    # Main session transcript
├── {session_id}/
│   └── subagents/
│       ├── agent-{agentId-1}.jsonl                      # Subagent transcript
│       ├── agent-{agentId-2}.jsonl
│       └── ...
└── {another_session_id}.jsonl
```

### File Format

Each `.jsonl` file contains one JSON object per line representing a conversation event:

```jsonl
{"type": "message", "role": "user", "content": "Hello"}
{"type": "message", "role": "assistant", "content": "Hi there!"}
{"type": "tool_use", "name": "search", "input": {...}}
```

### Required IAM Permissions

The application requires the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

## API Documentation

### Health Check

Check application health status.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T12:34:56.789Z"
}
```

**Status Codes**:
- `200 OK`: Application is healthy

---

### List Sessions

Get a list of all available conversation sessions.

**Endpoint**: `GET /api/sessions`

**Response**:
```json
{
  "sessions": [
    {
      "sessionId": "session-123",
      "lastModified": "2026-01-29T10:00:00.000Z",
      "size": 12345
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Sessions retrieved successfully
- `500 Internal Server Error`: S3 access error

---

### Get Session Transcript

Retrieve the full transcript for a specific session.

**Endpoint**: `GET /api/transcripts/:sessionId`

**Parameters**:
- `sessionId` (path): The unique session identifier

**Response**:
```json
{
  "sessionId": "session-123",
  "records": [
    {
      "type": "message",
      "role": "user",
      "content": "Hello"
    },
    {
      "type": "message",
      "role": "assistant",
      "content": "Hi there!"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Transcript retrieved successfully
- `404 Not Found`: Session not found
- `500 Internal Server Error`: S3 access error

---

### List Subagents

Get a list of all subagents for a specific session.

**Endpoint**: `GET /api/transcripts/:sessionId/subagents`

**Parameters**:
- `sessionId` (path): The unique session identifier

**Response**:
```json
{
  "subagents": [
    {
      "agentId": "agent-001",
      "key": "session-123/subagents/agent-agent-001.jsonl"
    },
    {
      "agentId": "agent-002",
      "key": "session-123/subagents/agent-agent-002.jsonl"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Subagents retrieved successfully
- `404 Not Found`: Session not found
- `500 Internal Server Error`: S3 access error

---

### Get Subagent Details

Retrieve the full transcript for a specific subagent.

**Endpoint**: `GET /api/transcripts/:sessionId/subagents/:agentId`

**Parameters**:
- `sessionId` (path): The unique session identifier
- `agentId` (path): The subagent identifier

**Response**:
```json
{
  "agentId": "agent-001",
  "records": [
    {
      "type": "message",
      "role": "user",
      "content": "Process this data"
    },
    {
      "type": "tool_use",
      "name": "data_processor",
      "input": {"data": "..."}
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Subagent transcript retrieved successfully
- `404 Not Found`: Subagent not found
- `500 Internal Server Error`: S3 access error

---

## Environment Variables

### Production Environment

```bash
# Backend Configuration
PORT=3000
NODE_ENV=production

# AWS S3 Configuration
TRANSCRIPT_BUCKET=your-bucket-name
AWS_REGION=ap-northeast-2
```

### Development Environment

```bash
# Backend Configuration
PORT=3001
NODE_ENV=development

# AWS S3 Configuration
TRANSCRIPT_BUCKET=your-bucket-name
AWS_REGION=ap-northeast-2

# Frontend Configuration
VITE_API_URL=http://localhost:3001
```

### Environment Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Port number for the backend server |
| `NODE_ENV` | No | development | Environment mode (development/production) |
| `TRANSCRIPT_BUCKET` | Yes | - | S3 bucket name containing transcripts |
| `AWS_REGION` | Yes | ap-northeast-2 | AWS region of the S3 bucket |
| `VITE_API_URL` | No | http://localhost:3000 | Backend API URL (development only) |

**Note**: AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are NOT required when running on EC2 with an Instance Profile.

## Testing

### Run All Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Backend Tests
Location: `backend/__tests__/`
- Framework: Jest + Supertest
- Run: `cd backend && npm test`

### Frontend Tests
Location: `frontend/__tests__/`
- Framework: Vitest + React Testing Library
- Run: `cd frontend && npm test`

### E2E Tests
Location: `e2e/`
- Framework: Playwright
- Run: `npm run test:e2e`
- Additional commands:
  - `npm run test:e2e:ui` - Run tests with UI mode
  - `npm run test:e2e:headed` - Run tests in headed mode (see browser)
  - `npm run test:e2e:debug` - Run tests in debug mode

## CI/CD

GitHub Actions workflow is configured to:
- Run linting
- Run type checking
- Run all tests with coverage (unit, integration, E2E)
- Upload coverage reports to Codecov
- Upload Playwright test reports

Workflow file: `.github/workflows/test.yml`

## Project Structure

```
claude-transcript-viewer/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── app.ts             # Express application setup
│   │   ├── index.ts           # Server entry point
│   │   ├── routes/            # API route handlers
│   │   │   └── sessions.ts
│   │   └── services/          # Business logic
│   │       ├── s3Client.ts
│   │       ├── sessionService.ts
│   │       └── subagentService.ts
│   ├── __tests__/             # Jest test files
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API client
│   │   ├── types/             # TypeScript type definitions
│   │   ├── utils/             # Utility functions
│   │   ├── layouts/           # Layout components
│   │   ├── App.tsx            # Main App component
│   │   └── main.tsx           # Entry point
│   ├── __tests__/             # Vitest test files
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── e2e/                        # E2E tests (Playwright)
│   └── example.spec.ts        # Playwright test files
├── Dockerfile                  # Production multi-stage build
├── Dockerfile.backend          # Development backend Dockerfile
├── Dockerfile.frontend         # Development frontend Dockerfile
├── docker-compose.yml          # Docker Compose configuration
├── playwright.config.ts        # Playwright configuration
├── .env.example                # Environment variables template
├── .github/
│   └── workflows/
│       └── test.yml            # CI/CD workflow
└── package.json                # Root workspace configuration
```

## Development Workflow

### Adding New Features

1. Write tests first (TDD approach)
2. Implement the feature
3. Run tests to ensure they pass
4. Run linting and type checking
5. Commit changes

### Code Quality Checks

```bash
# Run linter
npm run lint

# Run type checking
npm run typecheck

# Run all checks
npm run lint && npm run typecheck && npm test
```

### Building for Production

```bash
# Build both backend and frontend
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

## License

MIT

## Contributors

- Development Team

## Support

For issues and questions, please open an issue on the GitHub repository.
