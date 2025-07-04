#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function packageAllBanners(targetPath) {
  if (!targetPath) {
    console.error('Usage: node package-all-banners.js <path>');
    console.error('Example: node package-all-banners.js ./oda/products-july');
    process.exit(1);
  }

  const fullPath = path.resolve(targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Path '${targetPath}' does not exist`);
    process.exit(1);
  }

  const folders = fs.readdirSync(fullPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (folders.length === 0) {
    console.log(`No folders found in '${targetPath}'`);
    return;
  }

  console.log(`Found ${folders.length} folders to process:`);
  folders.forEach(folder => console.log(`  - ${folder}`));
  console.log('');

  folders.forEach((folder, index) => {
    const folderPath = path.join(targetPath, folder);
    console.log(`[${index + 1}/${folders.length}] Processing ${folder}...`);
    
    try {
      execSync(`FOLDER="${folderPath}" npm run package-banners`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Check for individual banner zip files and main banners.zip
      const bannerSizes = ['320x400.zip', '580x400.zip', '980x600.zip'];
      const sizeInfo = [];
      
      bannerSizes.forEach(bannerFile => {
        const bannerPath = path.join(folderPath, bannerFile);
        if (fs.existsSync(bannerPath)) {
          const stats = fs.statSync(bannerPath);
          const sizeInKB = (stats.size / 1024).toFixed(2);
          sizeInfo.push(`${bannerFile}: ${sizeInKB} KB`);
        }
      });
      
      const mainZipPath = path.join(folderPath, 'banners.zip');
      if (fs.existsSync(mainZipPath)) {
        const stats = fs.statSync(mainZipPath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        sizeInfo.push(`banners.zip: ${sizeInKB} KB`);
      }
      
      if (sizeInfo.length > 0) {
        console.log(`✓ Completed ${folder}`);
        console.log(`  File sizes: ${sizeInfo.join(', ')}\n`);
      } else {
        console.log(`✓ Completed ${folder}\n`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${folder}:`, error.message);
      console.log('');
    }
  });

  console.log('All folders processed!');
  
  // Generate master index.html
  generateMasterIndex(targetPath, folders);
}

function generateMasterIndex(targetPath, folders) {
  const title = path.basename(targetPath);
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - Master Index</title>
  <style>
    body { font-family: sans-serif; margin: 2em; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.5em 1em; text-align: left; }
    th { background: #f0f0f0; }
    a { color: #0074d9; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .center { text-align: center; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)} - Master Index</h1>
  <table>
    <thead>
      <tr><th>Brand</th><th>Banner Index</th><th>Download All Banners</th><th>Size</th></tr>
    </thead>
    <tbody>
      ${folders.map(folder => {
        const folderPath = path.join(targetPath, folder);
        const bannersZipPath = path.join(folderPath, 'banners.zip');
        const zipSize = fs.existsSync(bannersZipPath) 
          ? formatSize(fs.statSync(bannersZipPath).size)
          : '';
        
        return `<tr>
          <td>${escapeHtml(folder)}</td>
          <td><a href="${encodeURI(folder)}/index.html" target="_blank">View Banners</a></td>
          <td>${zipSize ? `<a href="${encodeURI(folder)}/banners.zip" download>Download</a>` : ''}</td>
          <td>${zipSize}</td>
        </tr>`;
      }).join('\n      ')}
    </tbody>
  </table>
</body>
</html>`;

  const indexPath = path.join(targetPath, 'index.html');
  fs.writeFileSync(indexPath, html);
  console.log(`Master index.html generated in ${targetPath}`);
}

function escapeHtml(str) {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

const targetPath = process.argv[2];
packageAllBanners(targetPath);