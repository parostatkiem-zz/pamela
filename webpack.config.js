const path = require("path");
require("@babel/register");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  externals: [nodeExternals()],
  target: "node",
  entry: path.resolve(__dirname, "./index.js"),
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js"],
    // alias: {
    //   util: "util",
    //   assert: "assert",
    //   url: "url",
    //   os: "os",
    //   vm: "vm-browserify",
    //   //   child_process: "empty",
    //   buffer: "buffer",
    // },
    // fallback: {
    //   fs: false,
    //   tls: false,
    //   net: false,
    //   path: false,
    //   zlib: false,
    //   http: false,
    //   https: false,
    //   stream: false,
    //   crypto: false,
    //   "crypto-browserify": false,
    // },
  },
  output: {
    path: path.resolve(__dirname, "."),
    filename: "pamela-production.js",
  },
};
