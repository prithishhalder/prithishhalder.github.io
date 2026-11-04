// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Dr. Prithish Halder',
  tagline: 'Astrophysicist & Adjunct Faculty | University of Nebraska-Lincoln',
  favicon: 'profile.jpg',

  url: 'https://prithishhalder.github.io',
  baseUrl: '/',

  organizationName: 'prithishhalder',
  projectName: 'prithishhalder.github.io',
  deploymentBranch: 'main',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false, // We'll use custom pages and blog for an academic personal website
        blog: {
          path: 'blog',
          routeBasePath: 'blog',
          showReadingTime: true,
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'profile.jpg',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Prithish Halder, PhD',
        logo: {
          alt: 'Dr. Prithish Halder',
          src: 'profile.jpg',
          style: { borderRadius: '50%' }
        },
        items: [
          {to: '/research', label: 'Research', position: 'left'},
          {to: '/publications', label: 'Publications', position: 'left'},
          {to: '/presentations', label: 'Presentations', position: 'left'},
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: '/gallery', label: 'Gallery', position: 'left'},
          {to: '/contact', label: 'Contact', position: 'left'},
          {
            href: 'https://scholar.google.com/citations?user=6hXcCtgAAAAJ&hl=en',
            label: 'Scholar',
            position: 'right',
          },
          {
            href: 'https://orcid.org/0000-0002-1073-1419',
            label: 'ORCID',
            position: 'right',
          },
          {
            href: 'https://github.com/prithishhalder',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'About',
            items: [
              {
                label: 'University of Nebraska-Lincoln',
                href: 'https://www.unl.edu/',
              },
              {
                label: 'Department of Physics & Astronomy',
                href: 'https://physics.unl.edu/',
              },
            ],
          },
          {
            title: 'Research Profiles',
            items: [
              {
                label: 'Google Scholar',
                href: 'https://scholar.google.com/citations?user=6hXcCtgAAAAJ&hl=en',
              },
              {
                label: 'NASA ADS',
                href: 'https://ui.adsabs.harvard.edu/search/q=author%3A%22Halder%2C%20Prithish%22',
              },
              {
                label: 'ORCID',
                href: 'https://orcid.org/0000-0002-1073-1419',
              },
              {
                label: 'ResearchGate',
                href: 'https://www.researchgate.net/profile/Prithish_Halder/scores',
              },
            ],
          },
          {
            title: 'Connect',
            items: [
              {
                label: 'Email (prithishh3@gmail.com)',
                href: 'mailto:prithishh3@gmail.com',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/prithishhalder',
              },
              {
                label: 'Download CV',
                href: 'pathname:///CV_Prithish_Halder.pdf',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Dr. Prithish Halder. Built with Docusaurus (Electron Architecture).`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
