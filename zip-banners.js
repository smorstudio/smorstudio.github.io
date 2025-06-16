const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

/**
 * Zips a folder into a .zip file
 * @param {string} sourceDir - The folder to zip
 * @param {string} outPath - The output zip file path
 * @returns {Promise<void>}
 */
function zipFolder(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Main function to zip banners and create banners.zip
 * @param {string} baseDir - The folder containing banner subfolders
 */
async function zipBanners(baseDir) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const bannerFolders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const zipFiles = [];

  // Zip each banner folder
  for (const folder of bannerFolders) {
    const folderPath = path.join(baseDir, folder);
    const zipPath = path.join(baseDir, folder + ".zip");
    await zipFolder(folderPath, zipPath);
    zipFiles.push(zipPath);
    console.log(`Zipped ${folder} -> ${zipPath}`);
  }

  // Create banners.zip
  const bannersZipPath = path.join(baseDir, "banners.zip");
  const output = fs.createWriteStream(bannersZipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);
  for (const zipFile of zipFiles) {
    archive.file(zipFile, { name: path.basename(zipFile) });
  }
  await archive.finalize();
  console.log(`Created ${bannersZipPath}`);
}

// CLI usage
if (require.main === module) {
  const folder = process.argv[2];
  if (!folder) {
    console.error("Usage: node zip-banners.js <folder>");
    process.exit(1);
  }
  zipBanners(folder).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}
