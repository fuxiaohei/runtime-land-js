import { downloadLandCli, extractTarGz, copyDirectory } from "./download.mjs"

const cliFile = "land-cli.tar.gz";
const cliDir = "land-cli-bin";
const version = "nightly"
const examplesDir = "../examples";


await downloadLandCli(version, cliFile);
await extractTarGz(cliFile, cliDir);
await copyDirectory(examplesDir, "test-examples");

import Fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import { resolve } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cliPath = resolve(__dirname, `${cliDir}/land-cli`);
const jsEnginePath = resolve(__dirname, "../land_js_sdk.wasm");

console.log("cliPath", cliPath);
console.log("jsEnginePath", jsEnginePath);

// iterator test-examples top directory
const examples = Fs.readdirSync("test-examples");
examples.forEach(async (example) => {
    console.log(example)
});

// exit
process.exit(0)