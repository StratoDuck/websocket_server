const path = require('path');
const webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const dev = argv.mode === 'development';

  const plugins = [new HtmlWebpackPlugin({template: './src/index.html'})];

  if (dev) {
    plugins.push(new webpack.HotModuleReplacementPlugin());
  }

  return {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'main.js'
    },
    devtool: dev ? 'source-map' : 'none',
    mode: 'development',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components)/,
          loader: 'babel-loader',
          options: { presets: ['@babel/env'] }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['*', '.js', '.jsx'],
      fallback: { util: require.resolve('util/')},
    },
    devServer: {
      contentBase: path.join(__dirname, 'public/'),
      port: 8080,
      publicPath: 'http://localhost:8080',
    },
    plugins,
  };
};
