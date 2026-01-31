# E2E Tests with Playwright

This directory contains end-to-end tests for the Claude Transcript Viewer application.

## Directory Structure

```
e2e/
├── fixtures/          # Mock data and test fixtures
│   └── mock-sessions.json
├── tests/            # Test specification files
│   ├── sessions.spec.ts
│   ├── transcripts.spec.ts
│   └── subagents.spec.ts
└── README.md
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Backend and frontend dependencies installed

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (first time only):
```bash
npx playwright install --with-deps
```

## Running Tests

### Run all E2E tests (headless mode)
```bash
npm run test:e2e
```

### Run tests with UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test sessions.spec.ts
```

### Run specific test by name
```bash
npx playwright test -g "should display sessions list"
```

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root level.

### Key Configuration:
- **Base URL**: http://localhost:5173
- **Backend Server**: http://localhost:3001
- **Test Directory**: ./e2e/tests
- **Browsers**: Chromium, Firefox, WebKit
- **Reporter**: HTML report + List

### Web Servers

The configuration automatically starts both servers before running tests:
1. Backend server on port 3001
2. Frontend server on port 5173

## Test Structure

All tests follow the AAA pattern:
- **Arrange**: Set up test data and navigate to page
- **Act**: Perform user actions
- **Assert**: Verify expected outcomes

Example:
```typescript
test('should display sessions list', async ({ page }) => {
  // Arrange: Navigate to the application
  await page.goto('/');

  // Act: Wait for sessions to load
  await page.waitForSelector('.session-list');

  // Assert: Verify sessions are displayed
  expect(await page.locator('.session-item').count()).toBeGreaterThan(0);
});
```

## Mock Data

Mock data is stored in `fixtures/mock-sessions.json` and can be used for testing:
- Session data
- Transcript messages
- Subagent information

## Viewing Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

E2E tests run automatically in GitHub Actions:
- Triggered on push to main/develop branches
- Triggered on pull requests
- Runs after backend and frontend tests pass
- Artifacts uploaded for 30 days

## Troubleshooting

### Tests fail to start servers
- Check if ports 3001 and 5173 are already in use
- Ensure backend and frontend dependencies are installed

### Browser not found
- Run `npx playwright install --with-deps`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if servers are starting correctly

## Best Practices

1. Keep tests independent and isolated
2. Use meaningful test descriptions
3. Follow existing code style (2 spaces, single quotes)
4. Clean up after tests (reset state)
5. Use fixtures for reusable test data
6. Add comments for complex test scenarios
