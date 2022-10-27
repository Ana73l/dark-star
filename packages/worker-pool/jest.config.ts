/* eslint-disable */
export default {
	displayName: 'worker-pool',
	preset: '../../jest.preset.js',
	moduleFileExtensions: ['ts', 'js', 'mjs', 'cjs'],
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.spec.json',
		},
	},
	coverageDirectory: '../../coverage/packages/worker-pool',
};
