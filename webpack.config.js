import nodeExternals from 'webpack-node-externals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typicalReact = {
  rules: [
    {
      test: /\.js$/,
      exclude: /(node_modules)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react'],
        },
      },
    },
  ],
};

const clientConfig = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'main.js',
  },
  mode: 'development',
  module: typicalReact,
};

const serverConfig = {
  entry: './server.js',
  output: {
    path: __dirname,
    filename: 'server-compiled.js',
  },
  externals: [nodeExternals()],
  target: 'node',
  mode: 'production',
  module: typicalReact,
};

export default [clientConfig, serverConfig];
