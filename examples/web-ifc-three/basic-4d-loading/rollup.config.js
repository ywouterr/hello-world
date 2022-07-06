import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/basic-4d-loading/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/basic-4d-loading/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};