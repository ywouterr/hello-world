import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-viewer/socket-io/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-viewer/socket-io/static/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};