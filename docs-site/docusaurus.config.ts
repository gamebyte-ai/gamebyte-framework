import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'GameByte Framework',
  tagline: 'Modern Mobile-First Game Development Framework',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Production URL
  url: 'https://docs.gamebyte.dev',
  baseUrl: '/',

  // GitHub Pages deployment config
  organizationName: 'gamebyte-ai',
  projectName: 'gamebyte-framework',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Custom fields for LLM integration
  customFields: {
    llmIndexUrl: '/llms.txt',
    llmFullApiUrl: '/llms-full.txt',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/', // Docs at root
          editUrl: 'https://github.com/gamebyte-ai/gamebyte-framework/tree/main/docs-site/',
        },
        blog: false, // Disable blog
        pages: false, // Disable pages (we use docs at root)
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/gamebyte-social-card.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'GameByte',
      logo: {
        alt: 'GameByte Framework Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/api-reference',
          label: 'API',
          position: 'left',
        },
        {
          to: '/ai-agent-guide',
          label: 'AI Agents',
          position: 'left',
        },
        {
          href: 'https://docs.gamebyte.dev/llms.txt',
          label: 'llms.txt',
          position: 'right',
        },
        {
          href: 'https://github.com/gamebyte-ai/gamebyte-framework',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/getting-started/installation',
            },
            {
              label: 'Core Concepts',
              to: '/core-concepts/architecture',
            },
            {
              label: 'API Reference',
              to: '/api-reference',
            },
          ],
        },
        {
          title: 'Features',
          items: [
            {
              label: '2D Rendering',
              to: '/rendering/2d-pixi',
            },
            {
              label: '3D Rendering',
              to: '/rendering/3d-three',
            },
            {
              label: 'UI Components',
              to: '/ui-components/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/gamebyte-ai/gamebyte-framework',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/gamebyte',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/gamebyte',
            },
          ],
        },
        {
          title: 'For AI',
          items: [
            {
              label: 'AI Agent Guide',
              to: '/ai-agent-guide',
            },
            {
              label: 'llms.txt',
              href: 'https://docs.gamebyte.dev/llms.txt',
            },
            {
              label: 'Full API',
              href: 'https://docs.gamebyte.dev/llms-full.txt',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} GameByte. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['typescript', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,

  // Plugins
  plugins: [],

  // Markdown configuration
  markdown: {
    mermaid: true,
  },

  // Head tags for SEO
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'llms-txt',
        content: '/llms.txt',
      },
    },
  ],
};

export default config;
