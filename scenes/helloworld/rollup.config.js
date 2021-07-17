import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'scenes/helloworld/app.js',
  output: [
    {
      format: 'esm',
      file: 'scenes/helloworld/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};