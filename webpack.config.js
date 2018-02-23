const webpack = require("webpack");

module.exports = {
  entry: {
    bundle: `${__dirname}/src/js/GPGPUParticles.js`
  },

  output: {
    filename: "bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.js[x]?$/,
        use: [{
          loader: "babel-loader",
          options: {
            presets: [
              ["env", {
                targets: { browsers: ["last 2 versions"] },
                modules: false
              }]
            ]
          }
        }],
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: "glslify-import-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: "raw-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: "glslify-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(glsl|frag|vert)$/,
        loader: "glsl-strip-comments",
        exclude: /node_modules/
      },
    ]
  },

  externals: [],

  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: { drop_console: true }
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
  ]
};
