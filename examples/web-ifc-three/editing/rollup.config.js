import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/editing/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/editing/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};