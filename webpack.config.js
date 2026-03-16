const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, argv = {}) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: 'development',
    entry: ['./src/renderer/shims/global.ts', './src/renderer/index.tsx'],
    target: 'web',
    devtool: isProduction ? false : 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: 'esnext',
              },
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('tailwindcss'),
                    require('autoprefixer'),
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'auto',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxAsyncSize: 240000,
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
      }),
    ],
  };
};
