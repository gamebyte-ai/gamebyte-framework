import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'GameByte Framework',
  tagline: 'Modern Mobile-First Game Development Framework for Building Hit Games',
  favicon: 'img/favicon.svg',

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
    // SEO social card
    image: 'img/gamebyte-og.png',

    // SEO metadata
    metadata: [
      { name: 'keywords', content: 'game development, mobile games, game framework, TypeScript, Pixi.js, Three.js, physics, UI components, game engine' },
      { name: 'author', content: 'GameByte' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'GameByte Framework' },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@gamebyte' },
      { name: 'twitter:creator', content: '@gamebyte' },
      { name: 'theme-color', content: '#7C44EA' },
      { name: 'msapplication-TileColor', content: '#7C44EA' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],

    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },

    // Announcement bar (optional)
    announcementBar: {
      id: 'ai_friendly',
      content: '🤖 AI-Agent Friendly! Check out <a href="/llms.txt">llms.txt</a> for AI integration',
      backgroundColor: '#7C44EA',
      textColor: '#ffffff',
      isCloseable: true,
    },

    navbar: {
      title: '', // Remove title, use logo only
      logo: {
        alt: 'GameByte Framework',
        src: 'img/logo-icon.svg',
        srcDark: 'img/logo-icon-dark.svg',
        width: 32,
        height: 32,
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
      logo: {
        alt: 'GameByte',
        src: 'img/logo-full.svg',
        href: 'https://gamebyte.ai',
        width: 160,
      },
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

    // Algolia search (placeholder - configure when ready)
    // algolia: {
    //   appId: 'YOUR_APP_ID',
    //   apiKey: 'YOUR_SEARCH_API_KEY',
    //   indexName: 'gamebyte',
    // },
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
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/img/favicon.svg',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/manifest.json',
      },
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'GameByte Framework',
        description: 'Modern Mobile-First Game Development Framework for Building Hit Games',
        url: 'https://docs.gamebyte.dev',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cross-platform',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        author: {
          '@type': 'Organization',
          name: 'GameByte',
          url: 'https://gamebyte.ai',
        },
      }),
    },
  ],
};

export default config;
