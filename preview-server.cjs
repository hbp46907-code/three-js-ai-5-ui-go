const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(process.cwd());
const manifestScript = path.join(root, "scripts", "generate-works-manifest.cjs");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

if (fs.existsSync(manifestScript)) {
  const result = spawnSync(process.execPath, [manifestScript], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.error || result.status !== 0) {
    console.warn("Unable to refresh works-manifest.json. The server will continue with the existing file.");
  }
}

http
  .createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    let filePath = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      });
      response.end(data);
    });
  })
  .listen(4173, "127.0.0.1", () => {
    console.log("Preview server running at http://127.0.0.1:4173");
  });
