import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'examples/web-ifc-viewer/google-drive-viewer/main.js',
  output: {
    file: "examples/web-ifc-viewer/google-drive-viewer/build/main.js",
    format: 'iife'
  },
  plugins: [ resolve(), commonjs() ]
};