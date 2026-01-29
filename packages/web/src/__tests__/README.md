# Frontend Tests

This directory contains frontend tests using Bun's built-in test runner and React Testing Library.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test Button.test.tsx
```

## Test Structure

- `setup.ts` - Test environment setup (extends expect with jest-dom matchers, cleanup)
- `Button.test.tsx` - Button component tests
- `ErrorBoundary.test.tsx` - Error boundary component tests
- `utils.test.ts` - Utility function tests

## Configuration

Tests are configured via `bunfig.toml` which preloads the setup file. Bun has built-in JSX support, so React components can be tested directly without additional transpilation.

## Dependencies

- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Additional DOM matchers for expect
- `@testing-library/user-event` - User interaction simulation
