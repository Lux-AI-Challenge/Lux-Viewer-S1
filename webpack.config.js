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
    bundle: path.join(__dirname, 'src', 'main.ts'),
  },
  target: 'web',
  module: {
    rules: [{
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: '/node_modules/',
      },
      {
        test: /phaser\.js$/,
        loader: 'expose-loader?Phaser',
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
  externals: {
    // todo: this framework needs to not import so many packages some how...
    // issue: If not excluded, it will require all packages such as mongoose, google cloud storage, express etc.
    // used for other features of dimensions-ai, but not used by the lux design package. need to look at why
    // importing anything from dimensions makes webpack think EVERYTHING is being used and needs to be bundled
    'dimensions-ai': 'dimensions_ai',
  },
  plugins: [
    // new BundleAnalyzerPlugin()
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
    }),
  ],
};