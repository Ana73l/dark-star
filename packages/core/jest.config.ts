/* eslint-disable */
export default {
	displayName: 'core',
	preset: '../../jest.preset.js',
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
		},
	},
	coverageDirectory: '../../coverage/packages/core',
};
