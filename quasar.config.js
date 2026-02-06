/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure(function (/* ctx */) {
  return {
    eslint: {
      warnings: true,
      errors: true
    },

    boot: [
      'firebase',
      'auth'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons',
      'material-symbols-outlined',
      'fontawesome-v6'
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16'
      },
      vueRouterMode: 'history',
      // Reduce memory usage in dev
      sourcemap: false,
      vitePlugins: [
        // Disabled: vite-plugin-checker can cause memory issues
        // ['vite-plugin-checker', {
        //   eslint: {
        //     lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"'
        //   }
        // }, { server: false }]
      ]
    },

    devServer: {
      open: true
    },

    framework: {
      config: {
        dark: true,
        brand: {
          primary: '#635BFF',
          secondary: '#0A2540',
          accent: '#FFB545',
          dark: '#0A2540',
          positive: '#00D4AA',
          negative: '#FF5470',
          info: '#00B4D8',
          warning: '#FFB545'
        },
        notify: {
          position: 'top-right',
          timeout: 3000
        },
        loading: {
          spinnerColor: 'primary'
        }
      },
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
        'BottomSheet'
      ]
    },

    animations: ['fadeIn', 'fadeOut', 'slideInUp', 'slideInDown', 'slideInLeft', 'slideInRight'],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      extendGenerateSWOptions(cfg) {
        cfg.skipWaiting = true;
        cfg.clientsClaim = true;
      },
      manifest: {
        name: 'Club Controller',
        short_name: 'ClubCtrl',
        description: 'Financial management for sports clubs',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0D47A1',
        theme_color: '#0D47A1',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    },

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'club-controller'
      }
    },

    bex: {
      contentScripts: ['my-content-script']
    }
  };
});
