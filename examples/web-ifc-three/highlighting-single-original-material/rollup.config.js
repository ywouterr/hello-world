import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/highlighting-single-original-material/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/highlighting-single-original-material/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};