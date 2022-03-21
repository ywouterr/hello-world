import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'examples/web-ifc-viewer/spatial-tree/app.js',
	output: [
		{
			format: 'esm',
			file: 'examples/web-ifc-viewer/spatial-tree/bundle.js'
		},
	],
	plugins: [
		resolve(),
	]
};