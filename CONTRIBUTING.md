# Contributing to GameByte Framework

Thank you for your interest in contributing to GameByte Framework! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@gamebyte-framework.dev.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git
- TypeScript knowledge
- Game development experience (helpful but not required)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gamebyte-framework.git
   cd gamebyte-framework
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Framework**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm run test
   ```

5. **Start Demo**
   ```bash
   npm run demo:serve
   ```

## Development Workflow

### Branch Strategy

- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Emergency fixes

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Add/update tests
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm run test:full
   npm run demo:build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript Guidelines

- **Strict Types**: Enable strict mode in tsconfig.json
- **Interfaces**: Prefer interfaces over types for object shapes
- **Generics**: Use generics for reusable components
- **Null Safety**: Use optional chaining and nullish coalescing

```typescript
// Good
interface GameConfig {
  width: number;
  height: number;
  renderer?: RendererType;
}

// Avoid
type GameConfig = {
  width: number;
  height: number;
  renderer: RendererType | undefined;
}
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Naming**: camelCase for variables, PascalCase for classes
- **File Names**: PascalCase for classes, camelCase for utilities

### Architecture Patterns

- **Dependency Injection**: Use the ServiceContainer
- **Service Providers**: Register services through providers
- **Facades**: Provide static access to services
- **SOLID Principles**: Follow SOLID design principles

```typescript
// Good - Dependency Injection
export class GameRenderer {
  constructor(
    private assetManager: AssetManager,
    private performanceMonitor: PerformanceMonitor
  ) {}
}

// Avoid - Direct instantiation
export class GameRenderer {
  private assetManager = new AssetManager();
  private performanceMonitor = new PerformanceMonitor();
}
```

## Testing Guidelines

### Unit Tests

- Test all public methods
- Mock dependencies
- Use descriptive test names
- Aim for 90%+ coverage

```typescript
describe('ServiceContainer', () => {
  it('should resolve singleton instances correctly', () => {
    const container = new ServiceContainer();
    container.singleton('test', () => new TestService());
    
    const instance1 = container.make('test');
    const instance2 = container.make('test');
    
    expect(instance1).toBe(instance2);
  });
});
```

### Integration Tests

- Test service provider registration
- Test facade functionality
- Test full application lifecycle

### Browser Tests

- Use Playwright for browser testing
- Test on multiple browsers
- Test mobile responsiveness

## Documentation

### Code Comments

- **JSDoc**: Use JSDoc for public APIs
- **Inline Comments**: Explain complex logic
- **TODO Comments**: Track future improvements

```typescript
/**
 * Creates a new GameByte application instance
 * @param config - Game configuration options
 * @returns Configured GameByte instance
 */
export function createGame(config?: GameConfig): GameByte {
  // Implementation
}
```

### README Updates

- Update feature lists
- Add new examples
- Update API documentation
- Keep changelog current

## Performance Guidelines

### Bundle Size

- Keep core bundle under 100KB gzipped
- Use dynamic imports for optional features
- Tree-shake unused code
- Analyze bundle with webpack-bundle-analyzer

### Runtime Performance

- Avoid memory leaks
- Use object pooling for frequently created objects
- Implement efficient collision detection
- Profile with browser dev tools

### Mobile Optimization

- Support device performance tiers
- Implement adaptive quality settings
- Test on real devices
- Consider battery usage

## Submitting Changes

### Pull Request Guidelines

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Testing**: Include test results
4. **Breaking Changes**: Document any breaking changes
5. **Screenshots**: For UI changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Browser compatibility verified

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one maintainer approval
3. **Testing**: Verify functionality works
4. **Documentation**: Check docs are updated
5. **Merge**: Squash and merge to develop

## Release Process

Contributors can help with releases by:

- Testing release candidates
- Updating documentation
- Writing migration guides
- Creating examples

See [RELEASE.md](./RELEASE.md) for detailed release procedures.

## Community

### Communication Channels

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time chat with community
- **Twitter**: Updates and announcements

### Getting Help

- Check existing issues and discussions
- Read the documentation
- Ask in Discord #help channel
- Create a GitHub discussion

## Recognition

Contributors are recognized through:

- GitHub contributor graph
- Release notes mentions
- Hall of fame in README
- Special Discord roles

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GameByte Framework! 🎮