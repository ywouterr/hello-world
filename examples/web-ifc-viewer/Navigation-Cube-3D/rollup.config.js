import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
export default {
	input: "examples/web-ifc-viewer/Navigation-Cube-3D/app.js",
	output: [
		{
			format: "esm",
			file: "examples/web-ifc-viewer/Navigation-Cube-3D/bundle.js",
		},
	],
	plugins: [resolve(), json()],
};
