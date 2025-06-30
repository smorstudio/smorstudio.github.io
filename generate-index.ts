import * as fs from "fs";
import * as path from "path";

function escapeHtml(str: string): string {
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ] as string)
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

type BannerRow = {
  bannerName: string;
  htmlPath: string;
  zipName: string;
  zipSize: string;
};

function getBannerRows(dir: string): BannerRow[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory());
  const zips = entries.filter((e) => e.isFile() && e.name.endsWith(".zip"));
  const zipMap: Record<string, string> = Object.fromEntries(
    zips.map((z) => [z.name.replace(/\.zip$/, ""), z.name])
  );

  // Exclude banners.zip from per-banner zips
  delete zipMap["banners"];

  return folders.map((folder) => {
    const bannerName = folder.name;
    const htmlPath = path.join(bannerName, "banner.html");
    const zipName = zipMap[bannerName] || "";
    const zipPath = zipName ? path.join(dir, zipName) : "";
    const zipSize =
      zipPath && fs.existsSync(zipPath)
        ? formatSize(fs.statSync(zipPath).size)
        : "";
    return {
      bannerName,
      htmlPath: fs.existsSync(path.join(dir, htmlPath)) ? htmlPath : "",
      zipName: zipName && fs.existsSync(zipPath) ? zipName : "",
      zipSize,
    };
  });
}

function generateIndexHtml(dir: string): string {
  const rows = getBannerRows(dir);
  const bannersZipPath = path.join(dir, "banners.zip");
  const bannersZip = fs.existsSync(bannersZipPath) ? "banners.zip" : null;
  const bannersZipSize = bannersZip
    ? formatSize(fs.statSync(bannersZipPath).size)
    : null;
  const title = path.basename(dir);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - Banner Index</title>
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
  <h1>${escapeHtml(title)} - Banner Index</h1>
  <table>
    <thead>
      <tr><th>Banner</th><th>Preview</th><th>Download ZIP</th><th>Size</th></tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.bannerName)}</td><td>${
              row.htmlPath
                ? `<a href="${encodeURI(
                    row.htmlPath
                  )}" target="_blank">Preview</a>`
                : ""
            }</td><td>${
              row.zipName
                ? `<a href="${encodeURI(row.zipName)}" download>Download</a>`
                : ""
            }</td><td>${row.zipSize}</td></tr>`
        )
        .join("\n      ")}
    </tbody>
  </table>
  ${
    bannersZip
      ? `<p class="center"><a href="${bannersZip}" download><strong>Download all banners (.zip)</strong></a> (${bannersZipSize})</p>`
      : ""
  }
</body>
</html>`;
}

// CLI usage
if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: node generate-index.js <folder>");
    process.exit(1);
  }
  const html = generateIndexHtml(dir);
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log("index.html generated in", dir);
}

export default generateIndexHtml;
