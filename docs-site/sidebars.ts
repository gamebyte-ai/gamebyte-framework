import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/first-game-tutorial',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts/architecture',
        'core-concepts/game-loop',
        'core-concepts/configuration',
      ],
    },
    {
      type: 'category',
      label: 'Rendering',
      items: [
        'rendering/overview',
        'rendering/2d-pixi',
        'rendering/3d-three',
        'rendering/hybrid-mode',
      ],
    },
    {
      type: 'category',
      label: 'Scenes',
      items: [
        'scenes/scene-management',
        'scenes/transitions',
      ],
    },
    {
      type: 'category',
      label: 'UI Components',
      items: [
        'ui-components/overview',
        'ui-components/button',
        'ui-components/panel',
        'ui-components/text',
        'ui-components/topbar',
        'ui-components/progress-bar',
        'ui-components/responsive-layout',
      ],
    },
    {
      type: 'category',
      label: 'Physics',
      items: [
        'physics/overview',
        'physics/2d-matter',
        'physics/3d-cannon',
      ],
    },
    {
      type: 'category',
      label: 'Audio',
      items: [
        'audio/overview',
        'audio/music-sfx',
        'audio/spatial-audio',
      ],
    },
    {
      type: 'category',
      label: 'Input',
      items: [
        'input/overview',
        'input/keyboard-mouse',
        'input/touch',
        'input/gamepad',
      ],
    },
    {
      type: 'category',
      label: 'Assets',
      items: [
        'assets/loading-caching',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/index',
      ],
    },
    {
      type: 'category',
      label: 'AI Agent Guide',
      items: [
        'ai-agent-guide/index',
        'ai-agent-guide/core-api',
        'ai-agent-guide/quick-reference',
      ],
    },
  ],
};

export default sidebars;
