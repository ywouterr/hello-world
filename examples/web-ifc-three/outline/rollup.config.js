import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "examples/web-ifc-three/outline/app.js",
  output: [
    {
      format: "esm",
      file: "examples/web-ifc-three/outline/bundle.js",
    },
  ],
  plugins: [resolve()],
};
