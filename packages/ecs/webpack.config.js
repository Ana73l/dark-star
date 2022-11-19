const { merge } = require('webpack-merge');

module.exports = (config, context) =>
	merge(config, {
		output: {
			iife: false,
		},
		resolve: {
			fallback: {
				os: false,
			},
		},
		module: {
			rules: [
				{ test: /\.ts$/, loader: 'ts-loader' }
			]
		}
	});
