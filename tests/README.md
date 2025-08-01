# GameByte Framework Test Suite

This directory contains comprehensive tests for the GameByte Framework, including unit tests, integration tests, and test utilities.

## Test Structure

```
tests/
├── __tests__/              # Main test files
│   ├── core/               # Core framework tests
│   ├── assets/             # Asset management tests
│   ├── rendering/          # Rendering system tests
│   ├── plugins/            # Plugin system tests
│   ├── facades/            # Facade pattern tests
│   └── integration/        # Integration tests
├── mocks/                  # Mock implementations
├── fixtures/               # Test data and fixtures
├── utils/                  # Test utilities
├── setup.ts               # Test environment setup
└── run-tests.js           # Test runner script
```

## Running Tests

### Using npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Using the test runner:

```bash
# Run all tests
node tests/run-tests.js

# Run specific test suite
node tests/run-tests.js unit
node tests/run-tests.js integration
node tests/run-tests.js coverage

# Show help
node tests/run-tests.js --help
```

## Test Categories

### 1. Core Framework Tests

Located in `__tests__/core/`, these test the fundamental framework components:

- **ServiceContainer**: Dependency injection container functionality
- **GameByte**: Main framework class, lifecycle management
- **ServiceProvider**: Service provider registration and booting

### 2. Asset Management Tests

Located in `__tests__/assets/`, these test the asset loading and caching systems:

- **LRUCache**: Memory-efficient caching with various eviction strategies
- **TextureLoader**: Image/texture loading with mobile optimization
- **GameByteAssetManager**: Comprehensive asset management functionality

### 3. Rendering System Tests

Located in `__tests__/rendering/`, these test the rendering abstractions:

- **RendererFactory**: Renderer creation and mode detection
- **Renderer implementations**: Mock tests for Pixi.js and Three.js renderers

### 4. Plugin System Tests

Located in `__tests__/plugins/`, these test the plugin architecture:

- **PluginManager**: Plugin registration, loading, and dependency management

### 5. Service Provider Tests

Located in `__tests__/services/`, these test the service providers:

- **RenderingServiceProvider**: Renderer service registration and configuration

### 6. Facade Tests

Located in `__tests__/facades/`, these test the facade pattern implementation:

- **Facade**: Base facade functionality and static method forwarding

### 7. Integration Tests

Located in `__tests__/integration/`, these test complete framework workflows:

- **FrameworkIntegration**: End-to-end framework initialization and usage

## Test Environment

### Browser API Mocks

The test environment includes comprehensive mocks for browser APIs:

- **HTMLCanvasElement**: Canvas element with 2D and WebGL context mocks
- **HTMLAudioElement**: Audio element with playback simulation
- **Image**: Image loading with dimension and format detection
- **localStorage/indexedDB**: Storage APIs for caching tests
- **fetch**: Network requests for asset loading
- **WebGL**: WebGL context and extension detection

### Setup Configuration

- **Jest Environment**: jsdom for browser-like environment
- **TypeScript**: Full TypeScript support with ts-jest
- **Fake Timers**: Controlled timer execution for async testing
- **Event Mocking**: EventEmitter and DOM event simulation

## Writing Tests

### Test Structure (AAA Pattern)

```typescript
describe('ComponentName', () => {
  let component: ComponentName;

  beforeEach(() => {
    // Arrange - Set up test environment
    component = new ComponentName();
  });

  afterEach(() => {
    // Cleanup
    component.destroy();
  });

  it('should perform expected behavior', () => {
    // Arrange - Prepare test data
    const input = 'test-input';

    // Act - Execute the behavior
    const result = component.method(input);

    // Assert - Verify the outcome
    expect(result).toBe('expected-output');
  });
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  // Arrange
  const asyncComponent = new AsyncComponent();

  // Act
  const result = await asyncComponent.asyncMethod();

  // Assert
  expect(result).toBeDefined();
});
```

### Testing Events

```typescript
it('should emit events', () => {
  // Arrange
  const eventSpy = jest.fn();
  component.on('test-event', eventSpy);

  // Act
  component.triggerEvent();

  // Assert
  expect(eventSpy).toHaveBeenCalledWith(expect.any(Object));
});
```

### Testing Error Scenarios

```typescript
it('should handle errors gracefully', () => {
  // Arrange
  const invalidInput = null;

  // Act & Assert
  expect(() => component.method(invalidInput)).toThrow('Expected error message');
});
```

## Coverage Goals

The test suite aims for high coverage across all framework components:

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- `coverage/lcov-report/index.html` - Detailed HTML report
- `coverage/lcov.info` - LCOV format for CI/CD
- `coverage/coverage-final.json` - JSON summary

## Best Practices

### 1. Test Isolation
- Each test should be independent and not rely on other tests
- Use `beforeEach`/`afterEach` for setup and cleanup
- Mock external dependencies to avoid side effects

### 2. Clear Test Names
- Use descriptive test names that explain the expected behavior
- Follow the pattern: "should [expected behavior] when [condition]"

### 3. Comprehensive Testing
- Test happy paths, edge cases, and error scenarios
- Include tests for async operations and event handling
- Test both positive and negative cases

### 4. Mock Management
- Use mocks for external dependencies (API calls, file system, etc.)
- Clear mocks between tests to avoid interference
- Verify mock interactions where appropriate

### 5. Performance Testing
- Include tests for memory usage and cleanup
- Test performance-critical paths with timing assertions
- Use fake timers for time-dependent operations

## Continuous Integration

The test suite is designed to run in CI/CD environments:

- **Node.js**: Compatible with Node.js 16+
- **Memory**: Tests use fake timers and mocked I/O for reliability
- **Parallelization**: Tests can run in parallel for faster execution
- **Reporting**: Generates reports in multiple formats for integration

## Troubleshooting

### Common Issues

1. **Timer-related test failures**: Ensure `jest.useFakeTimers()` is called in test setup
2. **Memory leaks in tests**: Verify proper cleanup in `afterEach` hooks
3. **Mock interference**: Clear mocks between tests with `jest.clearAllMocks()`
4. **Async test timeouts**: Increase Jest timeout or optimize test execution

### Debug Mode

Run tests with additional debugging:

```bash
# Enable verbose output
npm test -- --verbose

# Run specific test file
npm test -- --testNamePattern="ServiceContainer"

# Debug with Node.js inspector
npm test -- --runInBand --inspect-brk
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include both unit and integration tests for new features
3. Update this README if adding new test categories
4. Ensure all tests pass before submitting changes
5. Maintain or improve overall test coverage

For questions or issues with the test suite, please refer to the main project documentation or open an issue on the project repository.