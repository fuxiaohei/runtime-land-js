/**
 * @type {import('@rspack/cli').Configuration}
 */

module.exports = {
  context: __dirname,
  entry: {
    lib: "./src/index.js",
  },
  output: {
    filename: "[name].js",
  },
  target: 'node',
};
