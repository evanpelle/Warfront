const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const UiModuleLoader = require("./scripts/WebpackUIModuleLoader");
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
	entry: {
		main: "./src/Loader.ts"
	},
	output: {
		publicPath: "/",
		path: path.resolve(__dirname, './out'),
		filename: "[name]-bundle.js"
	},
	resolve: {
		extensions: [".ts", ".js"],
		alias: {
			'@resources': path.resolve(__dirname, 'resources/'),
		}
	},
	module: {
		rules: [
			{
				test: /\.json$/,
				type: 'asset/resource'
			},
			{
				test: /\.ts$/,
				use: ["ts-loader"]
			},
			{
				test: /\.ts$/,
				use: ["map-loader"],
				include: path.resolve(__dirname, "./src/map/MapRegistry.ts")
			},
			{
				test: /\.ts$/,
				use: ["menu-loader"],
				include: path.resolve(__dirname, "./src/client/ui/ModuleLoader.ts")
			},
			{
				test: /\.ts$/,
				use: ["theme-loader"],
				include: path.resolve(__dirname, "./src/client/graphics/GameTheme.ts")
			},
			{
				test: /\.(png|jpg|gif)$/i,
				type: 'asset/resource'
			}
		]
	},
	resolveLoader: {
		alias: {
			"map-loader": path.resolve(__dirname, "./scripts/map-loader.js"),
			"menu-loader": path.resolve(__dirname, "./scripts/menu-loader.js"),
			"theme-loader": path.resolve(__dirname, "./scripts/theme-loader.js")
		}
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/template.html"
		}),
		new HtmlInlineScriptPlugin(),
		new UiModuleLoader(),
		new CopyPlugin({
			patterns: [
				{from: 'resources/maps/WorldTerrain.json', to: 'assets/WorldTerrain.json'},
			],
		}),
	]
};