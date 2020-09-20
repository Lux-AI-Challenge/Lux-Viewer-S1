var path = require("path");
var webpack = require('webpack');
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

var pathToPhaser = path.join(__dirname, "/node_modules/phaser/");
// var pathToLux = path.join(__dirname, "/node_modules/@lux-ai/2020-challenge");
var phaser = path.join(pathToPhaser, "dist/phaser.js");
// var lux = path.join(pathToLux, "dist/lux.js");

module.exports = {
    entry: "./src/main.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js"
    },
    module: {
      rules: [
        { test: /\.ts$/, loader: "ts-loader", exclude: "/node_modules/" },
        { test: /phaser\.js$/, loader: "expose-loader?Phaser" },
        // { test: /lux\.js$/, loader: "expose-loader?Lux" }
      ]
    },
    devServer: {
      contentBase: path.resolve(__dirname, "./"),
      publicPath: "/dist/",
      host: "localhost",
      port: 3000,
      open: true,
      watchContentBase: true,
    },
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        phaser: phaser,
        // lux: lux,
      }
    },
    node: {
      child_process: 'empty',
      tls: 'empty',
      net: 'empty',
      fs: 'empty',
      dns: 'empty',
    },
    externals:{
      "dimensions-ai": {}
    },
    // plugins: [
    //   new BundleAnalyzerPlugin()
    // ]
  };