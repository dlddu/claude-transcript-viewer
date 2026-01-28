# claude-transcript-viewer

A monorepo project for viewing and managing Claude conversation transcripts.

## Project Structure

```
claude-transcript-viewer/
├── backend/          # Express + TypeScript API server
│   ├── src/         # Source code (to be implemented)
│   ├── __tests__/   # Jest test files
│   ├── jest.config.js
│   ├── tsconfig.json
│   └── package.json
├── frontend/         # React + Vite + Tailwind UI
│   ├── src/         # Source code (to be implemented)
│   ├── __tests__/   # Vitest test files
│   ├── vitest.config.ts
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
└── package.json      # Root workspace configuration
```

## Tech Stack

### Backend
- Node.js 20+
- Express.js
- TypeScript
- Jest (testing)
- Supertest (API testing)

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- Vitest (testing)
- React Testing Library

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Development

```bash
# Start both backend and frontend in development mode
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend
```

### Build

```bash
# Build both backend and frontend
npm run build

# Build backend only
npm run build:backend

# Build frontend only
npm run build:frontend
```

### Linting & Type Checking

```bash
# Run linter for all workspaces
npm run lint

# Run type checking for all workspaces
npm run typecheck
```

## Testing

### Backend Tests
Location: `backend/__tests__/`
- Health check endpoint tests
- Framework: Jest + Supertest
- Run: `cd backend && npm test`

### Frontend Tests
Location: `frontend/__tests__/`
- App component rendering tests
- Framework: Vitest + React Testing Library
- Run: `cd frontend && npm test`

## CI/CD

GitHub Actions workflow is configured to:
- Run linting
- Run type checking
- Run all tests with coverage
- Upload coverage reports to Codecov

Workflow file: `.github/workflows/test.yml`

## Phase 1 Implementation (TDD Red Phase)

The following tests have been created and are currently failing (as expected in TDD):

### Backend
- `/health` endpoint should return 200 OK
- Response should be JSON
- Response should contain status "ok"
- Response should include timestamp
- Timestamp should be valid ISO 8601 format

### Frontend
- App component should render without crashing
- Should render main container element
- Should have proper semantic HTML structure
- Should render app title (h1)
- Title should contain "Claude Transcript Viewer"

## Implementation Status

### Backend
- Express server with health check endpoint - IMPLEMENTED
- TypeScript configuration - CONFIGURED
- CORS enabled - CONFIGURED
- Jest tests - PASSING

### Frontend
- React App component with title - IMPLEMENTED
- Tailwind CSS styling - CONFIGURED
- Semantic HTML (main role) - IMPLEMENTED
- Vitest tests - PASSING

### Docker
- docker-compose.yml - CONFIGURED
- Dockerfile.backend - CONFIGURED
- Dockerfile.frontend - CONFIGURED

## API Endpoints

### Health Check
- **GET** `/health`
  - Response: `{ status: 'ok', timestamp: '2026-01-27T12:34:56.789Z' }`
  - Status Code: 200 OK
  - Content-Type: application/json

## Development URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

## Docker Usage

### Start services
```bash
docker-compose up
```

### Stop services
```bash
docker-compose down
```

### Rebuild images
```bash
docker-compose up --build
```

## Environment Variables

Create a `.env` file in the root directory (see `.env.example`):

```bash
# Backend
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
```

## Next Steps

1. Add transcript upload functionality
2. Add transcript parsing and storage
3. Add transcript viewing UI
4. Add conversation search and filtering
5. Add user authentication
