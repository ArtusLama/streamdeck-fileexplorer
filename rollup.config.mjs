import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "node:path";
import url from "node:url";
import copy from "rollup-plugin-copy";
import native from "rollup-plugin-native";

/*global process*/
const isWatching = !!process.env.ROLLUP_WATCH;
const sdPlugin = "de.artus.fileexplorer.sdPlugin";

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
	input: "src/plugin.ts",
	output: {
		file: `${sdPlugin}/bin/plugin.js`,
		sourcemap: isWatching,
		sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
			return url.pathToFileURL(path.resolve(path.dirname(sourcemapPath), relativeSourcePath)).href;
		},
	},
	plugins: [
		{
			name: "watch-externals",
			buildStart: function () {
				this.addWatchFile(`${sdPlugin}/manifest.json`);
				this.addWatchFile(`${sdPlugin}/ui/`);
			},
		},
		typescript({
			mapRoot: isWatching ? "./" : undefined,
		}),
		native(),
		nodeResolve({
			browser: false,
			exportConditions: ["node"],
			preferBuiltins: true,
		}),
		commonjs(),
		!isWatching && terser(),
		{
			name: "emit-module-package-file",
			generateBundle() {
				this.emitFile({ fileName: "package.json", source: `{ "type": "module" }`, type: "asset" });
			},
		},
		copy({
			copyOnce: true,
			targets: [
				{
					src: "node_modules/is-hidden-file/",
					dest: `${sdPlugin}/bin/node_modules`,
				},
			],
		}),
	],
};

export default config;
