import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'examples/web-ifc-viewer/floorplans/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-viewer/floorplans/bundle.js'
    },
  ],
  plugins: [
    resolve(),
    commonjs()
  ]
};