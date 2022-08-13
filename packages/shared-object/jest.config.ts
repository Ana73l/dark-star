/* eslint-disable */
export default {
	displayName: 'shared-object',
	preset: '../../jest.preset.js',
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
		},
	},
	coverageDirectory: '../../coverage/packages/shared-object',
};
