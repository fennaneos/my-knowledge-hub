// @ts-check
// docusaurus.config.js

import math from 'remark-math';
import katex from 'rehype-katex';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DevDocs',
  tagline: 'Developer Knowledge Hub',
  url: 'https://your-site.com',
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
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          remarkPlugins: [math],
          rehypePlugins: [katex],
        },
        blog: false,
        pages: false,
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

  themeConfig: {
    navbar: {
      title: '',
      logo: { alt: 'Dev Logo', src: 'img/beard_logo.png' },
      items: [
        { type: 'doc', docId: 'intro', position: 'left', label: 'Documentation' },
        { href: 'https://github.com/your-repo', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} DevDocs.`,
    },
    colorMode: { defaultMode: 'dark', disableSwitch: true, respectPrefersColorScheme: false },
  },

  // ✅ Local plugin to inject webpack aliases (v3-compatible)
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
