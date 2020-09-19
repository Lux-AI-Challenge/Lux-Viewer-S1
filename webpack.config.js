var path = require("path");
var webpack = require('webpack')

var pathToPhaser = path.join(__dirname, "/node_modules/phaser/");
var phaser = path.join(pathToPhaser, "dist/phaser.js");

module.exports = {
    entry: "./src/main.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js"
    },
    module: {
      rules: [
        { test: /\.ts$/, loader: "ts-loader", exclude: "/node_modules/" },
        { test: /phaser\.js$/, loader: "expose-loader?Phaser" }
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
        phaser: phaser
      }
    }
  };