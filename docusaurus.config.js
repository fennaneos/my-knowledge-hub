// @ts-check
// docusaurus.config.js


/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DevDocs',
  tagline: 'Developer Knowledge Hub',
  url: 'https://your-site.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'your-org', // Replace with your GitHub org/user
  projectName: 'your-repo-name', // Replace with your repo name

presets: [
  [
    'classic',
    /** @type {import('@docusaurus/preset-classic').Options} */
    ({
      docs: {
  routeBasePath: '/', // ✅ This makes docs load at /
  sidebarPath: require.resolve('./sidebars.js'),
},
      blog: false,
      pages: false, // ✅ Disable non-doc pages
      theme: {
        customCss: require.resolve('./src/css/custom.css'),
      },
    }),
  ],
],



  themeConfig: {
    navbar: {
      title: '',
      logo: {
        alt: 'Dev Logo',
        src: 'img/beard_logo.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/your-repo', // replace with actual repo
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} DevDocs.`,
    },
    colorMode: {
  defaultMode: 'dark',
  disableSwitch: true,
  respectPrefersColorScheme: false,
},

  },
};

export default config;

