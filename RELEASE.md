# Release Procedure

This document outlines the release process for the GameByte Framework.

## Release Types

### Patch Release (x.x.X)
- Bug fixes
- Documentation updates
- Performance improvements
- Security patches

### Minor Release (x.X.x)
- New features
- API additions (backwards compatible)
- Deprecations (with migration guide)

### Major Release (X.x.x)
- Breaking changes
- API removals
- Architecture changes
- Major feature additions

## Pre-Release Checklist

### 1. Code Quality
- [ ] All tests pass (`npm run test`)
- [ ] Code coverage is above 90% (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Demo builds and runs (`npm run demo:build && npm run demo:serve`)

### 2. Documentation
- [ ] CHANGELOG.md is updated
- [ ] README.md reflects new features
- [ ] API documentation is updated
- [ ] Migration guide for breaking changes (major releases)
- [ ] Demo showcases new features

### 3. Security & Performance
- [ ] Security audit passes (`npm audit`)
- [ ] Bundle size is acceptable (`npm run build:analyze`)
- [ ] Performance benchmarks are stable (`npm run benchmark`)
- [ ] Browser compatibility tests pass (`npm run test:browser`)

### 4. Version Management
- [ ] Version number follows semantic versioning
- [ ] package.json version is updated
- [ ] Git tag is created

## Release Process

### 1. Prepare Release Branch
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.3

# Update version in package.json
npm version [patch|minor|major] --no-git-tag-version

# Update CHANGELOG.md
# Add release notes and migration guide if needed
```

### 2. Quality Assurance
```bash
# Run full test suite
npm run test:full

# Run security audit
npm audit --audit-level=moderate

# Build and test demo
npm run demo:build
npm run demo:serve # Manual testing

# Performance check
npm run benchmark
npm run build:analyze
```

### 3. Create Pull Request
- Create PR from `release/v1.2.3` to `main`
- Include changelog in PR description
- Request review from maintainers
- Ensure all CI checks pass

### 4. Merge and Tag
```bash
# After PR approval, merge to main
git checkout main
git pull origin main

# Create and push tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### 5. Automated Release
The GitHub Actions workflow will automatically:
- Run tests and build the framework
- Create GitHub release with changelog
- Publish to npm registry
- Deploy demo to GitHub Pages
- Build and push Docker image

## Post-Release Tasks

### 1. Verify Release
- [ ] Check npm package: https://npmjs.com/package/@gamebyte/framework
- [ ] Test installation: `npm install @gamebyte/framework@latest`
- [ ] Verify demo site: https://gamebyte-framework.dev
- [ ] Check GitHub release page

### 2. Communication
- [ ] Update Discord/Slack channels
- [ ] Tweet about new release
- [ ] Update website if applicable
- [ ] Notify dependent projects

### 3. Monitor
- [ ] Watch for bug reports
- [ ] Monitor download statistics
- [ ] Check for security vulnerabilities
- [ ] Update dependencies regularly

## Hotfix Process

For critical bugs in production:

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/v1.2.4

# Fix the issue
# Update tests
# Update version patch number

# Create PR to main
# After merge, tag and release
git tag -a v1.2.4 -m "Hotfix v1.2.4"
git push origin v1.2.4

# Merge hotfix back to develop
git checkout develop
git merge main
```

## Version Naming Convention

- **Alpha**: `v1.0.0-alpha.1` - Early development
- **Beta**: `v1.0.0-beta.1` - Feature complete, testing phase
- **RC**: `v1.0.0-rc.1` - Release candidate
- **Stable**: `v1.0.0` - Production ready

## Rollback Procedure

If a release has critical issues:

```bash
# Unpublish from npm (within 72 hours)
npm unpublish @gamebyte/framework@1.2.3

# Or deprecate if outside 72-hour window
npm deprecate @gamebyte/framework@1.2.3 "Critical bug, use v1.2.2"

# Revert GitHub release
# Create hotfix with proper version
```

## Tools and Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test:full": "npm run lint && npm run typecheck && npm run test:coverage && npm run test:browser",
    "release:prepare": "npm run test:full && npm run build && npm run demo:build",
    "release:patch": "npm version patch && git push --follow-tags",
    "release:minor": "npm version minor && git push --follow-tags",
    "release:major": "npm version major && git push --follow-tags"
  }
}
```

### Conventional Commits
We use conventional commits for automated changelog generation:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

Example:
```
feat(renderer): add WebGPU support for 3D rendering

- Implement WebGPU renderer class
- Add device detection for WebGPU support
- Update renderer factory to handle WebGPU
- Add WebGPU examples to demo

BREAKING CHANGE: Minimum browser requirements updated
```

## Security Releases

For security vulnerabilities:

1. **Do not** create public issues or PRs
2. Email security@gamebyte-framework.dev
3. Follow responsible disclosure
4. Coordinate with security team for release timing
5. Include CVE information in release notes