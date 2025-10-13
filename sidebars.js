/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
      customProps: { hideStars: true },
    },
    {
      type: 'category',
      label: 'Finance Courses',
      collapsed: false,
      items: [
        'finance/monte-carlo',
        'finance/Actions-indices', // case-sensitive
        'finance/fx',
        'finance/skew-smile',
        'finance/autocallables',
        'finance/calls-and-puts',
        'finance/forwards-dividends',
        'finance/convexity-adjustment',
        'finance/discountcurve',
        'finance/ema-macd-strategy', // new doc
      ],
    },
    {
      type: 'category',
      label: 'Premium Courses',
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'premium/volatility-handbook',
          label: 'Volatility Handbook',
          customProps: { premium: true, badge: 'Premium' },
        },
      ],
    },
  ],
};
