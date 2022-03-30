import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-viewer/gltf-export/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-viewer/gltf-export/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};