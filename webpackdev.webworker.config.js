const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin');
const path = require('path');
module.exports = {
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
  ],
  mode: 'development',
  devtool: 'inline-source-map'
};
