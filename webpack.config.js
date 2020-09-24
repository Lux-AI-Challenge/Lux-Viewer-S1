var path = require('path');
var webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const {
  BundleAnalyzerPlugin
} = require('webpack-bundle-analyzer');

var pathToPhaser = path.join(__dirname, '/node_modules/phaser/');
// var pathToLux = path.join(__dirname, "/node_modules/@lux-ai/2020-challenge");
var phaser = path.join(pathToPhaser, 'dist/phaser.js');
// var lux = path.join(pathToLux, "dist/lux.js");

module.exports = {
  // entry: "./src/main.ts",
  mode: 'none',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  entry: {
    app: path.join(__dirname, 'src', 'index.tsx'),
    phaser: phaser,
    // bundle: path.join(__dirname, 'src', 'game', 'index.ts'),
  },
  target: 'web',
  module: {
    rules: [{
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /\.(tsx)$/,
        use: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ['file-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      // { test: /lux\.js$/, loader: "expose-loader?Lux" }
    ],
  },
  devServer: {
    contentBase: path.resolve(__dirname, './'),
    publicPath: '/dist/',
    host: 'localhost',
    port: 3000,
    open: true,
    watchContentBase: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
    alias: {
      phaser: phaser,
      // lux: lux,
    },
  },
  node: {
    child_process: 'empty',
    tls: 'empty',
    net: 'empty',
    fs: 'empty',
    dns: 'empty',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    usedExports: true,
    providedExports: true,
    sideEffects: true,
  },
  mode: 'production',
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
    }),
  ],
};