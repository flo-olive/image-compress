#!/usr/bin/env node
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const TARGET_SIZE = 300 * 1024; // 300kb
const dirArg = process.argv[2];

if (!dirArg) {
  console.error("사용법: node compress.js <디렉토리 경로>");
  process.exit(1);
}

const dir = path.resolve(dirArg);

if (!fs.existsSync(dir)) {
  console.error(`디렉토리 없음: ${dir}`);
  process.exit(1);
}

async function compressJpeg(filePath) {
  const originalSize = fs.statSync(filePath).size;
  for (let quality = 80; quality >= 30; quality -= 10) {
    const buf = await sharp(filePath)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (buf.length <= TARGET_SIZE || quality <= 30) {
      return { buf, originalSize };
    }
  }
}

async function compressPng(filePath) {
  const originalSize = fs.statSync(filePath).size;
  for (const colours of [256, 128, 64]) {
    const buf = await sharp(filePath)
      .png({ compressionLevel: 9, palette: true, colours })
      .toBuffer();
    if (buf.length <= TARGET_SIZE || colours === 64) {
      return { buf, originalSize };
    }
  }
}

async function processFile(filePath) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);

  if (base.endsWith("_mini")) {
    console.log(`건너뜀 (이미 _mini): ${path.basename(filePath)}`);
    return;
  }

  if (stats.size <= TARGET_SIZE) {
    console.log(
      `건너뜀 (${(stats.size / 1024).toFixed(0)}kb ≤ 300kb): ${path.basename(filePath)}`,
    );
    return;
  }

  let result;
  if (ext === ".jpg" || ext === ".jpeg") {
    result = await compressJpeg(filePath);
  } else if (ext === ".png") {
    result = await compressPng(filePath);
  }

  if (!result) return;

  const { buf, originalSize } = result;
  const outputPath = path.join(dirName, `${base}_mini${ext}`);

  fs.writeFileSync(outputPath, buf);
  fs.unlinkSync(filePath);

  const saved = ((1 - buf.length / originalSize) * 100).toFixed(0);
  const origKb = (originalSize / 1024).toFixed(0);
  const finalKb = (buf.length / 1024).toFixed(0);

  if (buf.length > TARGET_SIZE) {
    console.log(
      `⚠ ${path.basename(filePath)} → ${path.basename(outputPath)} (${origKb}kb → ${finalKb}kb, 300kb 미만 달성 불가)`,
    );
  } else {
    console.log(
      `✓ ${path.basename(filePath)} → ${path.basename(outputPath)} (${origKb}kb → ${finalKb}kb, ${saved}% 감소)`,
    );
  }
}

function collectFiles(dirPath) {
  const results = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  const files = collectFiles(dir);

  if (files.length === 0) {
    console.log("JPG/PNG 파일이 없습니다.");
    return;
  }

  console.log(`\n🔍 ${files.length}개 이미지 파일 발견\n`);

  for (const file of files) {
    await processFile(file);
  }

  console.log("\n✅ 완료");
}

main().catch((err) => {
  console.error("오류:", err.message);
  process.exit(1);
});
