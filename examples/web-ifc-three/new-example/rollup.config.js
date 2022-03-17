import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/new-example/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/new-example/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};