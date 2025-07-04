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
}

const targetPath = process.argv[2];
packageAllBanners(targetPath);