import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/element-orientation/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/element-orientation/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};