#!/bin/bash

echo "Validating AI-Agent-Friendly Documentation"
echo "=============================================="

# Check Tier 1 docs exist
echo ""
echo "Checking Tier 1 (Core Knowledge)..."
if [ -f "docs/agent-guide/CORE_API.md" ]; then
    WORD_COUNT=$(wc -w < docs/agent-guide/CORE_API.md)
    TOKEN_EST=$((WORD_COUNT * 4 / 3))
    echo "  CORE_API.md exists ($WORD_COUNT words ~ $TOKEN_EST tokens)"

    if [ $TOKEN_EST -gt 2500 ]; then
        echo "  Warning: Token count exceeds 2000 target"
    fi
else
    echo "  CORE_API.md missing"
    exit 1
fi

if [ -f "docs/agent-guide/QUICK_REFERENCE.md" ]; then
    echo "  QUICK_REFERENCE.md exists"
else
    echo "  QUICK_REFERENCE.md missing"
    exit 1
fi

# Check guides have keywords
echo ""
echo "Checking Tier 2 (Guide keywords)..."
GUIDES_WITH_KEYWORDS=$(grep -r "<!-- keywords:" docs/guides/ 2>/dev/null | wc -l)
TOTAL_GUIDES=$(find docs/guides/ -name "*.md" -type f 2>/dev/null | wc -l)

if [ $TOTAL_GUIDES -eq 0 ]; then
    echo "  Warning: No guides found in docs/guides/"
else
    echo "  $GUIDES_WITH_KEYWORDS/$TOTAL_GUIDES guides have keywords"

    if [ $GUIDES_WITH_KEYWORDS -lt $TOTAL_GUIDES ]; then
        echo "  Some guides missing keywords:"
        find docs/guides/ -name "*.md" -type f -exec sh -c '
            if ! grep -q "<!-- keywords:" "$1"; then
                echo "     - $1"
            fi
        ' _ {} \;
    fi
fi

# Check examples exist
echo ""
echo "Checking Tier 3 (Examples)..."
if [ -d "examples/" ]; then
    EXAMPLE_COUNT=$(find examples/ -name "*.html" -type f 2>/dev/null | wc -l)
    echo "  $EXAMPLE_COUNT example files found"
else
    echo "  Warning: No examples/ directory"
    EXAMPLE_COUNT=0
fi

# Check TypeScript JSDoc
echo ""
echo "Checking TypeScript JSDoc examples..."
JSDOC_EXAMPLES=$(grep -r "@example" src/ 2>/dev/null | wc -l)
echo "  $JSDOC_EXAMPLES JSDoc examples found"

# Summary
echo ""
echo "=============================================="
echo "Validation complete!"
echo ""
echo "Agent-friendly features:"
echo "  - Core API: ~$TOKEN_EST tokens"
echo "  - Guides with keywords: $GUIDES_WITH_KEYWORDS"
echo "  - Working examples: $EXAMPLE_COUNT"
echo "  - JSDoc examples: $JSDOC_EXAMPLES"
