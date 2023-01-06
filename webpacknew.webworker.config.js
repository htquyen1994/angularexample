const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const { HashedModuleIdsPlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');
module.exports = {
  optimization: {
    noEmitOnErrors: true,
    // runtimeChunk: 'single',
    splitChunks: {
      cacheGroups: {
        default: {
          chunks: 'async',
          minChunks: 2,
          priority: 10
        },
        common: {
          name: 'common',
          chunks: 'async',
          minChunks: 2,
          enforce: true,
          priority: 5
        },
        vendors: false,
        vendor: false
      }
    },
    minimizer: [
      new HashedModuleIdsPlugin(),
      new TerserPlugin({
        terserOptions: {
          safari10: true,
          sourceMap: true,
          output: {
            ascii_only: true,
            comments: false,
            webkit: true,
          },
          compress: {
            pure_getters: true,
            passes: 3,
            inline: 3,
            drop_console: true
          }
        }
      }),
    ]
  },
  entry: {
    handlingworker: './tile.worker.ts',
    cacheworker_shared: './sharedcache.worker.ts',
    cacheworker: './cache.worker.ts',
    hubworker: './worker-hub.worker.ts'
  },
  context: path.resolve(__dirname, 'src/worker_bundle'),
  externals: {
    Rx: 'rxjs'
  },
  resolve: {
    modules: [
      "node_modules",
    ],
    extensions: ['.js', '.ts']
  },
  plugins: [
    new ReplaceInFileWebpackPlugin([
      {
        dir: '../PeriscopeCore/wwwroot/client/assets/workers',
        files: [
          'main.js',
          'handlingworker.js',
          'cacheworker_shared.js',
          'cacheworker.js',
          'hubworker.js'
      ],
        rules: [
          {
            search: '}(exports,',
            replace: '}('
          }
        ]
      }
    ]),
    new ProgressPlugin(),
    new CircularDependencyPlugin({ exclude: /[\\\/]node_modules[\\\/]/ }),
  ],
  module: {
    rules: [
      // process the TypeScript files and detects any templates and stylesheets in Component decorators
      {
        test: /\.ts$/,
        use: '@ngtools/webpack'
      },
      // extract source maps
      {
        test: /\.js$/,
        exclude: /(ngfactory|ngstyle).js$/,
        enforce: 'pre',
        use: 'source-map-loader'
      },
      // This hides some deprecation warnings that Webpack throws
      {
        test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
        parser: { system: true },
      },
      {
        test: /\.js$/,
        loader: '@angular-devkit/build-optimizer/webpack-loader',
        options: { sourceMap: false }
      },
    ]
  },
  mode: 'production'
};
