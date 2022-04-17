import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'examples/web-ifc-three/voxelization/app.js',
  output: [
    {
      format: 'esm',
      file: 'examples/web-ifc-three/voxelization/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};