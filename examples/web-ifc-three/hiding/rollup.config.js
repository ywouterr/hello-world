import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/hiding/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/hiding/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};