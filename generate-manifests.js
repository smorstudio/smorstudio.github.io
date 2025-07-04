#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function extractDimensionsFromPath(folderPath) {
  const folderName = path.basename(folderPath);
  const match = folderName.match(/(\d+)x(\d+)/);
  if (match) {
    return {
      width: match[1],
      height: match[2]
    };
  }
  return null;
}

function generateManifest(folderPath, dimensions) {
  const folderName = path.basename(folderPath);
  const parentFolder = path.basename(path.dirname(folderPath));
  
  const manifest = {
    "version": "1.0",
    "title": `${dimensions.width}x${dimensions.height} Banner`,
    "description": "",
    "width": dimensions.width,
    "height": dimensions.height,
    "events": {
      "enabled": 0
    },
    "clicktags": {
      "clickTAG": "https://site.adform.com"
    },
    "source": "index.html"
  };
  
  return JSON.stringify(manifest, null, 2);
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let manifestsCreated = 0;
  
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      const dimensions = extractDimensionsFromPath(fullPath);
      
      if (dimensions) {
        // This is a banner folder (contains dimensions in name)
        const manifestPath = path.join(fullPath, 'manifest.json');
        const indexPath = path.join(fullPath, 'index.html');
        
        // Only create manifest if index.html exists and manifest doesn't exist
        if (fs.existsSync(indexPath) && !fs.existsSync(manifestPath)) {
          const manifestContent = generateManifest(fullPath, dimensions);
          fs.writeFileSync(manifestPath, manifestContent);
          console.log(`Created manifest.json in ${fullPath}`);
          manifestsCreated++;
        } else if (fs.existsSync(manifestPath)) {
          console.log(`Skipped ${fullPath} (manifest.json already exists)`);
        }
      } else {
        // Recursively process subdirectories
        manifestsCreated += processDirectory(fullPath);
      }
    }
  }
  
  return manifestsCreated;
}

function generateManifests(targetPath) {
  if (!targetPath) {
    console.error('Usage: node generate-manifests.js <path>');
    console.error('Example: node generate-manifests.js ./oda/products-july');
    process.exit(1);
  }

  const fullPath = path.resolve(targetPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Path '${targetPath}' does not exist`);
    process.exit(1);
  }

  console.log(`Generating manifest.json files in ${targetPath}...`);
  const manifestsCreated = processDirectory(fullPath);
  console.log(`\nCompleted! Created ${manifestsCreated} manifest.json files.`);
}

const targetPath = process.argv[2];
generateManifests(targetPath);