import cfg from '@neovici/cfg/eslint/index.mjs';

export default [
	{
		ignores: ['dist/', 'coverage/'],
	},
	...cfg,
	{
		rules: {
			'max-lines-per-function': 0,
			'import/group-exports': 0,
		},
	},
	{
		files: ['test/**/*.test.ts'],
		rules: {
			'max-lines': 'off',
		},
	},
];
