# Agent Integration Guide

How to integrate GameByte with your AI agent or RAG system.

<!-- keywords: integration, agent, rag, setup, configuration, llm -->

---

## For Autonomous Game Builder Agents

**Example: GameByte Agent**

### 1. Initialize with Core Knowledge

Load Tier 1 docs at startup:

```typescript
const coreAPI = await readFile('docs/agent-guide/CORE_API.md');
const quickRef = await readFile('docs/agent-guide/QUICK_REFERENCE.md');

// Add to agent context (2500 tokens total)
agent.loadContext(coreAPI + quickRef);
```

### 2. Enable Dynamic Discovery

Allow agent to search guides:

```typescript
// Agent searches when encountering unknown patterns
async function discoverGuide(keyword: string) {
  const results = await grep('-r', keyword, 'docs/guides/');
  return results.map(r => readFile(r.file));
}

// Example: Agent needs physics collision info
const guide = await discoverGuide('physics.*collision');
```

### 3. Provide Example Access

Let agent reference working code:

```typescript
// Agent requests example for platformer physics
const example = await readFile('examples/platformer/index.html');
// Agent can now see working implementation
```

---

## For Code-Writing AI Assistants

**Example: Claude Code, GitHub Copilot**

### 1. TypeScript IntelliSense

GameByte's rich JSDoc provides autocomplete hints:

```typescript
// Agent types: createGame()
// IDE shows:
/**
 * Create a fully-initialized game engine.
 *
 * @example
 * const game = createGame();
 * await game.initialize(canvas, '2d');
 * game.start();
 */
```

### 2. Context-Aware Suggestions

When agent sees partial code:

```typescript
const game = createGame();
await game.
// Agent suggests: initialize(), start(), make(), register()
// With JSDoc examples for each
```

---

## RAG System Integration

### Index Strategy

**Option 1: Pre-index all docs**

```bash
# Generate embeddings for all markdown
find docs/ -name "*.md" -type f | xargs -I {} \
  generate-embedding {} --output embeddings/

# Query at runtime
query-embeddings "how to add physics collision" --top 3
```

**Option 2: Hybrid (Tier 1 + RAG)**

```typescript
// Always load Tier 1
const tier1 = loadCoreAPI();

// RAG for Tier 2+
async function getRelevantDocs(query: string) {
  const semanticResults = await rag.search(query, { top: 3 });
  const grepResults = await grep(query, 'docs/guides/');
  return [...semanticResults, ...grepResults];
}
```

---

## Prompt Engineering

### Recommended System Prompt

```markdown
You are building a game with GameByte Framework.

**Core Knowledge:**
[Include docs/agent-guide/CORE_API.md here]

**Discovery:**
- When encountering unknown patterns, search docs/guides/
- Reference examples/ for working code patterns
- Use grep with keywords from markdown comments

**Defaults:**
- Always use createGame() instead of manual setup
- Trust smart defaults (resolution, antialias, etc.)
- Use pre-built components (UIButton, ArcheroMenu)
- Target 44px minimum touch targets

**Anti-Patterns:**
- Don't manually register service providers
- Don't hardcode values (use ResponsiveScaleCalculator)
- Don't skip lifecycle hooks (onEnter/onExit)
```

---

## Testing Agent Integration

Use validation script:

```bash
npm run validate:agent-docs
```

Ensures:
- Core API < 2500 tokens
- All guides have keywords
- Examples are runnable
- JSDoc examples exist

---

## Metrics for Success

**Agent Performance Indicators:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Context size | < 2500 tokens | Tier 1 only |
| Discovery time | < 5s | grep search |
| Code reduction | 80%+ | Lines vs vanilla |
| Success rate | 90%+ | Working on first try |

---

## Example Agent Workflow

**User:** "Create a platformer game"

**Agent:**
1. Loads CORE_API.md (knows createGame, initialize, start)
2. Searches: `grep -r "platformer" examples/`
3. Finds: `examples/platformer/index.html`
4. Generates working game based on pattern

---
