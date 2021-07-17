import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'Introduction/app.js',
  output: [
    {
      format: 'esm',
      file: 'Introduction/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};