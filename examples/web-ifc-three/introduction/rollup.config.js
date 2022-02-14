import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/introduction/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/introduction/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};