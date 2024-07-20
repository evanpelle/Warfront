const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
	entry: {
		main: "./src/client/Index.ts"
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'out'),
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: './src/client/index.html',
			filename: 'index.html'
		}),
	],
	devtool: 'inline-source-map',
	mode: 'development',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: ["ts-loader"]
			},
			{
				test: /\.ts$/,
				use: ["map-loader"],
				include: path.resolve(__dirname, "./src/core/map/MapRegistry.ts")
			},
		]
	},
	resolveLoader: {
		alias: {
			"map-loader": path.resolve(__dirname, "./scripts/map-loader.js"),
		}
	},
};