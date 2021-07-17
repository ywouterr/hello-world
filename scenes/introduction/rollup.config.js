import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'scenes/introduction/app.js',
  output: [
    {
      format: 'esm',
      file: 'scenes/introduction/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};