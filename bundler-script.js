// const { exec } = require('child_process');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const BUNDLERCONFIGNAME = 'rollup.config.js';
const BUNDLERCOMMAND = 'rollup --config ';

// Gets all directories contained in the current directory
const { promises: { readdir } } = fs;
const getDirectories = async source =>
	(await readdir(source, { withFileTypes: true }))
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

// Bundles the specified directory
async function bundlePath(path) {
	try {
		const { stdout, stderr } = await exec(BUNDLERCOMMAND + path);
		console.log('stdout:', stdout);
		console.log('stderr:', stderr);
	} catch (e) {
		console.error(e); // should contain code (exit code) and signal (that caused the termination).
	}
	// exec(BUNDLERCOMMAND + path, (error, stdout, stderr) => {
	// 	if (error) return console.log(`error: ${error.message}`);
	// 	if (stderr) return console.log(`stderr: ${stderr}`);
	// 	console.log(`stdout: ${stdout}`);
	// });
}

// Bundles the specified dir if it there is a bundler config recursively
async function traverseAndBundle(path) {
	const result = await fs.promises.readdir(path);
	if(result.length === 0) return;

	let isProjectFolder = false;
	result.forEach(file => {
		if (file === BUNDLERCONFIGNAME) isProjectFolder = true;
	});

	if (isProjectFolder) {
		const bundlerPath = path + '/' + BUNDLERCONFIGNAME;
		await bundlePath(bundlerPath);
	}

	const directories = await getDirectories(path);
	for (const directory of directories) {
		await traverseAndBundle(path + '/' + directory);
	}
}

traverseAndBundle('./examples');

// bundlePath("./examples/web-ifc-viewer/visibility/rollup.config.js");