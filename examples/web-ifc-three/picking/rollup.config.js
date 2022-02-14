import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/picking/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/picking/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};