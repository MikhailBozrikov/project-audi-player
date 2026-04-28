const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  devtool: 'source-map', // Включаем source maps для удобной отладки
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true, // Включаем source maps для CSS
            }
          }
        ]
      },
      {
        test: /\.(ttf|svg|png|jpg|gif)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/images', to: 'images' },
        { from: 'src/fonts', to: 'fonts' }
      ]
    })
  ],
  devServer: {
    static: './dist',
    port: 3000,
    hot: true,
    open: true,
    webSocketServer: 'ws',
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    ]
  }
};