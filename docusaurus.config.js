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
  url: 'http://localhost:3000', // or your site URL
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'your-org',
  projectName: 'your-repo-name',

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
        pages: false, // keep pages off; we’ll use a redirect instead
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
          // Keep this—clicking “Documentation” goes to "/" which redirects to /intro
          { type: 'doc', docId: 'intro', position: 'left', label: 'Documentation' },
          { to: '/finance/Actions-indices', label: 'Finance Courses', position: 'left' },
          { to: '/premium/volatility-handbook', label: 'Premium Courses', position: 'left' },
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
    // ✅ Redirect "/" → "/intro" while keeping "/intro" working
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [{ from: '/', to: '/intro' }],
      },
    ],

    // Your webpack alias plugin (unchanged)
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
