import Fs from 'fs'
import Https from 'https'
import { pipeline } from 'stream/promises';
import tar from 'tar';
import { join } from 'path';

async function downloadFile(url, targetFile) {
    return await new Promise((resolve, reject) => {
        Https.get(url, response => {
            const code = response.statusCode ?? 0

            if (code >= 400) {
                return reject(new Error(response.statusMessage))
            }

            // handle redirects
            if (code > 300 && code < 400 && !!response.headers.location) {
                return resolve(
                    downloadFile(response.headers.location, targetFile)
                )
            }

            // save the file to disk
            const fileWriter = Fs
                .createWriteStream(targetFile)
                .on('finish', () => {
                    console.log(`download ${targetFile} success`)
                    resolve({})
                })

            response.pipe(fileWriter)
        }).on('error', error => {
            reject(error)
        })
    })
}

async function downloadLandCli(version, targetFile) {
    console.log("download land-cli")
    return downloadFile(`https://github.com/fuxiaohei/runtime-land/releases/download/${version}/land-cli-${version}-linux-x86_64.tar.gz`, targetFile)
}

export { downloadLandCli };

async function extractTarGz(tarFilePath, extractionDir) {
    try {
        // Ensure the extraction directory exists
        Fs.mkdirSync(extractionDir, { recursive: true });

        // Create a readable stream from the tar.gz file
        const tarStream = Fs.createReadStream(tarFilePath);

        // Create a writable stream to the extraction directory
        const extractStream = tar.extract({
            cwd: extractionDir,
        });

        // Use the pipeline function to pipe the streams and extract the contents
        await pipeline(tarStream, extractStream);

        console.log('Extraction complete.');
    } catch (err) {
        console.error('Error extracting the tar.gz file:', err);
    }
}

export { extractTarGz };

// Function to copy a directory recursively
async function copyDirectory(source, destination) {
    try {
        // Create destination directory if it doesn't exist
        Fs.mkdirSync(destination, { recursive: true });

        // Read the contents of the source directory
        const files = Fs.readdirSync(source);

        // Copy each file from the source to the destination
        for (const file of files) {
            const sourcePath = join(source, file);
            const destPath = join(destination, file);

            // Check if the item is a directory
            const stats = Fs.statSync(sourcePath);
            if (stats.isDirectory()) {
                // Recursively copy subdirectories
                await copyDirectory(sourcePath, destPath);
            } else {
                // Copy the file
                Fs.copyFileSync(sourcePath, destPath);
            }
        }

        console.log(`Directory "${source}" copied to "${destination}".`);
    } catch (err) {
        console.error('Error copying directory:', err);
    }
}

export { copyDirectory }