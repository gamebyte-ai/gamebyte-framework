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
      label: 'Layout System',
      items: [
        'layout/overview',
        'layout/presets',
        'layout/layout-manager',
        'layout/examples',
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
        {
          type: 'category',
          label: 'Basic Components',
          collapsed: false,
          items: [
            'ui-components/button',
            'ui-components/panel',
            'ui-components/text',
            'ui-components/progress-bar',
          ],
        },
        {
          type: 'category',
          label: 'Form Components',
          collapsed: false,
          items: [
            'ui-components/input',
            'ui-components/checkbox',
            'ui-components/radio-group',
            'ui-components/select',
            'ui-components/toggle',
            'ui-components/slider',
          ],
        },
        {
          type: 'category',
          label: 'Layout Components',
          collapsed: false,
          items: [
            'ui-components/list',
            'ui-components/scrollbox',
            'ui-components/topbar',
            'ui-components/navigation',
            'ui-components/responsive-layout',
          ],
        },
        {
          type: 'category',
          label: 'Game Components',
          collapsed: false,
          items: [
            'ui-components/level-selector',
            'ui-components/tooltip',
            'ui-components/modal',
            'ui-components/bottom-sheet',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Screens & Panels',
      items: [
        'boilerplate/overview',
        'boilerplate/screen-manager',
        'boilerplate/simple-screen',
        'boilerplate/screens',
        'boilerplate/panels',
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
        'input/virtual-joystick',
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
    {
      type: 'category',
      label: 'Changelog',
      items: [
        'changelog/changelog',
        'changelog/v1.3.0',
      ],
    },
  ],
};

export default sidebars;
