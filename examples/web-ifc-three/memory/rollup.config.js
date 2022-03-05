import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/memory/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/memory/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};