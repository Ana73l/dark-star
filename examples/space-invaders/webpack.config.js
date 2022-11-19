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
		devServer: {
			headers: {
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp',
			},
		},
	});
