import babel from 'rollup-plugin-babel';

export default {
	input: 'src/index.js',
	output: [
		{ file: 'index.js', format: 'cjs', sourcemap: true },
		{ file: 'index.mjs', format: 'esm', sourcemap: true }
	],
	plugins: [
		babel({
			plugins: [
				['transform-async-to-promises', {
					inlineHelpers: true
				}]
			],
			presets: [
				['@babel/env', {
					loose: true,
					modules: false,
					targets: { node: 6 },
					useBuiltIns: 'entry'
				}]
			]
		})
	]
};
