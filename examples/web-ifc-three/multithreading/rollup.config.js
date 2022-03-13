import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/multithreading/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/multithreading/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};