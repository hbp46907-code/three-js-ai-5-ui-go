const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const worksRoot = path.join(root, "works");
const qiuRoot = fs.existsSync(path.join(worksRoot, "Qiu"))
  ? path.join(worksRoot, "Qiu")
  : path.join(root, "QIU");
const qiuSphereAssetRoot = path.join(root, "assets", "qiu-sphere");
const outputPath = path.join(root, "works-manifest.json");
const browserDataPath = path.join(root, "js", "works-data.js");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);
const CATEGORY_ORDER = ["Design", "Photograph", "Poster", "Project", "Video"];

const collator = new Intl.Collator("zh-CN", {
  numeric: true,
  sensitivity: "base",
});

function toWebPath(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function stripExtension(fileName) {
  return path.basename(fileName, path.extname(fileName));
}

function readPngSize(buffer) {
  const isPng = buffer.length >= 24
    && buffer.toString("ascii", 1, 4) === "PNG"
    && buffer.toString("ascii", 12, 16) === "IHDR";
  if (!isPng) { return null; }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegSize(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) { return null; }
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + size;
  }
  return null;
}

function readImageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".png") { return readPngSize(buffer); }
  if (extension === ".jpg" || extension === ".jpeg") { return readJpegSize(buffer); }
  return null;
}

function getLayout(type, size) {
  if (type === "video") { return "wide"; }
  if (!size || !size.width || !size.height) { return "portrait"; }
  return size.width / size.height >= 1.45 ? "wide" : "portrait";
}

function createWorkEntry(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(extension);
  const type = isVideo ? "video" : "image";
  const size = isVideo ? null : readImageSize(filePath);
  const entry = {
    type,
    title: stripExtension(filePath),
    src: toWebPath(filePath),
    layout: getLayout(type, size),
  };

  if (size) {
    entry.width = size.width;
    entry.height = size.height;
  }

  return entry;
}

function emptyDirectorySafe(directoryPath) {
  const resolvedDirectory = path.resolve(directoryPath);
  const resolvedRoot = path.resolve(root);
  if (!resolvedDirectory.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Refusing to clean outside project: ${resolvedDirectory}`);
  }

  fs.mkdirSync(resolvedDirectory, { recursive: true });
  for (const dirent of fs.readdirSync(resolvedDirectory, { withFileTypes: true })) {
    const targetPath = path.join(resolvedDirectory, dirent.name);
    if (dirent.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }
  }
}

function scanCategory(categoryName) {
  const categoryPath = path.join(worksRoot, categoryName);
  if (!fs.existsSync(categoryPath)) { return []; }

  return fs.readdirSync(categoryPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => path.join(categoryPath, dirent.name))
    .filter((filePath) => {
      const extension = path.extname(filePath).toLowerCase();
      return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
    })
    .sort((a, b) => collator.compare(path.basename(a), path.basename(b)))
    .map(createWorkEntry);
}

function scanLooseFolder(folderPath) {
  if (!fs.existsSync(folderPath)) { return []; }

  return fs.readdirSync(folderPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => path.join(folderPath, dirent.name))
    .filter((filePath) => {
      const extension = path.extname(filePath).toLowerCase();
      return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
    })
    .sort((a, b) => collator.compare(path.basename(a), path.basename(b)))
    .map(createWorkEntry);
}

function scanQiuSphereFolder() {
  const entries = scanLooseFolder(qiuRoot);
  emptyDirectorySafe(qiuSphereAssetRoot);

  return entries.map((entry, index) => {
    const extension = path.extname(entry.src).toLowerCase();
    const safeFileName = `qiu-${String(index + 1).padStart(3, "0")}${extension}`;
    const sourcePath = path.join(root, entry.src);
    const safePath = path.join(qiuSphereAssetRoot, safeFileName);
    fs.copyFileSync(sourcePath, safePath);
    return {
      ...entry,
      sphereSrc: toWebPath(safePath),
    };
  });
}

function scanWorks() {
  const categoryNames = new Set(CATEGORY_ORDER);
  if (fs.existsSync(worksRoot)) {
    for (const dirent of fs.readdirSync(worksRoot, { withFileTypes: true })) {
      if (dirent.isDirectory()) { categoryNames.add(dirent.name); }
    }
  }

  const orderedCategories = [
    ...CATEGORY_ORDER,
    ...[...categoryNames].filter((name) => !CATEGORY_ORDER.includes(name)).sort(collator.compare),
  ];

  const manifest = {};
  for (const categoryName of orderedCategories) {
    manifest[categoryName] = scanCategory(categoryName);
  }

  // 右上角照片球专用图片源。这里独立于作品分类，方便后续只替换 QIU 文件夹中的图片。
  manifest.QIU = scanQiuSphereFolder();
  return manifest;
}

const manifest = scanWorks();
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
fs.writeFileSync(outputPath, manifestJson, "utf8");
fs.writeFileSync(browserDataPath, `window.WORKS_MANIFEST = ${manifestJson}`, "utf8");

const total = Object.values(manifest).reduce((sum, works) => sum + works.length, 0);
console.log(`Generated works-manifest.json and js/works-data.js with ${total} works.`);
