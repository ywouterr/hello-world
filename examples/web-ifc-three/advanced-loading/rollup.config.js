import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/advanced-loading/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/advanced-loading/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};