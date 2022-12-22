const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ProvidePlugin } = require('webpack');
const JSON5 = require('json5');
const packageInformation = require('./package.json');

module.exports = {
	entry: {
		options: './src/options',
	},
	plugins: [
		new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
		new HtmlWebpackPlugin({ 
			template: 'src/options.html',
			filename: 'options.html',
			chunks: ['options'],
		}),
		new CopyWebpackPlugin({
			patterns: [
				{ from: './src/manifest.json', to: 'manifest.json', transform: copyPackageInformationToExtensionManifest },
				{ from: './src/_locales', to: '_locales', transform: stripJsonComments },
				// { from: './src/images', to: 'images' },
			],
		}),
		new MiniCssExtractPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			// https://stackoverflow.com/a/39609018/4274827
			{
				test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
				use: "url-loader" 
			},
			{
				test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
				use: "file-loader" 
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '...'],
	},
}

function copyPackageInformationToExtensionManifest(content) {
	const parsedManifest = JSON.parse(content.toString());

	parsedManifest.version = packageInformation.version;

	return JSON.stringify(parsedManifest, null, 4);
}

function stripJsonComments(content) {
	const parsedManifest = JSON5.parse(content.toString());

	return JSON.stringify(parsedManifest, null, 4);
}