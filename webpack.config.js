import path from 'path';
import {fileURLToPath} from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	entry: './src/client/Client.ts',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'out'),
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.(png|jpe?g|gif)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'images/[hash][ext][query]'
				}
			}
		],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/client/index.html',
			filename: 'index.html'
		}),
	],
	devServer: {
		static: {
			directory: path.join(__dirname, 'out'),
		},
		compress: true,
		port: 9000,
		proxy: [
			{
				context: ['/socket'],
				target: 'ws://localhost:3000',
				ws: true,
			},
		],
	},
};