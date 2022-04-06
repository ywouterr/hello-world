import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-viewer/gltf-import/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-viewer/gltf-import/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};