import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/outline-edges/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/outline-edges/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};