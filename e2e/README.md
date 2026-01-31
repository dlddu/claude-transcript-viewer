# E2E Tests

End-to-end tests for Claude Transcript Viewer using Playwright.

## Setup

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

## Running Tests

Run all E2E tests:

```bash
npm run test:e2e
```

Run tests in UI mode (interactive):

```bash
npm run test:e2e:ui
```

Run tests in debug mode:

```bash
npm run test:e2e:debug
```

Run specific test file:

```bash
npx playwright test e2e/example.spec.ts
```

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project.

Key settings:
- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Automatically starts with `npm run dev` before tests

## Test Structure

Tests follow the AAA pattern:
- **Arrange**: Set up test data and conditions
- **Act**: Perform the action being tested
- **Assert**: Verify the expected outcome

Example:

```typescript
test('should display welcome message', async ({ page }) => {
  // Arrange & Act
  await page.goto('/');

  // Assert
  const welcomeText = page.getByText('Welcome to Claude Transcript Viewer');
  await expect(welcomeText).toBeVisible();
});
```

## CI/CD

E2E tests run automatically on GitHub Actions:
- On push to `main` or `develop` branches
- On pull requests to `main` or `develop` branches

The workflow:
1. Installs dependencies
2. Installs Playwright browsers
3. Runs E2E tests
4. Uploads test report as artifact

## Debugging

View test report after running tests:

```bash
npx playwright show-report
```

Generate trace for debugging:

```bash
npx playwright test --trace on
```
