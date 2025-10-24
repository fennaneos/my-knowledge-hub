// docusaurus.config.js
// @ts-check

import math from 'remark-math';
import katex from 'rehype-katex';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DevDocs',
  tagline: 'Developer Knowledge Hub',
  url: 'http://localhost:3000',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  // ⬇️ moved per deprecation (see markdown.hooks below)
  // onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'your-org',
  projectName: 'your-repo-name',

  // New location for the old onBrokenMarkdownLinks
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // docs at site root
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [math],
          rehypePlugins: [katex],
        },
        blog: false,
        // ✅ enable the pages plugin with default settings (boolean may fail validation in your version)
        pages: {},
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '',
        logo: { alt: 'Dev Logo', src: 'img/beard_logo.png' },
        items: [
          { type: 'doc', docId: 'intro', position: 'left', label: 'Home' },
      { to: '/virtual-trading', label: 'Virtual Trading', position: 'right' },
          { to: '/finance/Actions-indices', label: 'Finance Courses', position: 'left' },
          { to: '/backtest', label: 'Backtest', position: 'right' },
          { to: '/premium/volatility-handbook', label: 'Premium Courses', position: 'left' },

          // links to new pages
          { to: '/lab', label: 'Lab', position: 'right' },
          { to: '/pricing-labs', label: 'Get Pro', position: 'right' },

          { href: 'https://github.com/fennaneos', label: 'GitHub', position: 'right' },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} DevDocs.`,
      },
      colorMode: { defaultMode: 'dark', disableSwitch: true, respectPrefersColorScheme: false },
    }),

  plugins: [
    function codemirrorAliasPlugin() {
      return {
        name: 'codemirror-alias-plugin',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@codemirror/state': require.resolve('@codemirror/state'),
                '@codemirror/view': require.resolve('@codemirror/view'),
                '@codemirror/language': require.resolve('@codemirror/language'),
              },
            },
          };
        },
      };
    },
  ],
};

export default config;
