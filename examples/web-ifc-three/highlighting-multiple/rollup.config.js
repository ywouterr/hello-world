import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/highlighting-multiple/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/highlighting-multiple/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};