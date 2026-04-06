#!/usr/bin/env node
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PRIMARY_RATIO = 0.5;   // -50%
const SECONDARY_RATIO = 0.4; // -60%
const SECONDARY_THRESHOLD = 500 * 1024; // 500kb 이상이면 2차 압축

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

async function compressJpeg(filePath, targetSize) {
  for (let quality = 80; quality >= 10; quality -= 10) {
    const buf = await sharp(filePath)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
    if (buf.length <= targetSize || quality <= 10) {
      return buf;
    }
  }
}

async function compressPng(filePath, targetSize) {
  for (const colours of [256, 128, 64, 32, 16]) {
    const buf = await sharp(filePath)
      .png({ compressionLevel: 9, palette: true, colours })
      .toBuffer();
    if (buf.length <= targetSize || colours === 16) {
      return buf;
    }
  }
}

async function processFile(filePath) {
  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);

  if (base.endsWith("_mini") || /_mini_\d+kb$/.test(base)) {
    console.log(`건너뜀 (이미 _mini): ${path.basename(filePath)}`);
    return;
  }

  const originalSize = stats.size;
  const primaryTarget = Math.floor(originalSize * PRIMARY_RATIO);

  let buf;
  if (ext === ".jpg" || ext === ".jpeg") {
    buf = await compressJpeg(filePath, primaryTarget);
  } else if (ext === ".png") {
    buf = await compressPng(filePath, primaryTarget);
  } else {
    return;
  }

  if (!buf) return;

  // 1차 압축 후 500kb 이상이면 원본에서 -60%로 재압축
  let usedRatio = "-50%";
  if (buf.length >= SECONDARY_THRESHOLD) {
    const secondaryTarget = Math.floor(originalSize * SECONDARY_RATIO);
    let buf2;
    if (ext === ".jpg" || ext === ".jpeg") {
      buf2 = await compressJpeg(filePath, secondaryTarget);
    } else if (ext === ".png") {
      buf2 = await compressPng(filePath, secondaryTarget);
    }
    if (buf2) {
      buf = buf2;
      usedRatio = "-60%";
    }
  }

  const finalKb = Math.round(buf.length / 1024);
  const origKb = Math.round(originalSize / 1024);
  const saved = Math.round((1 - buf.length / originalSize) * 100);

  const outputPath = path.join(dirName, `${base}_mini_${finalKb}kb${ext}`);

  fs.writeFileSync(outputPath, buf);
  fs.unlinkSync(filePath);

  console.log(
    `✓ ${path.basename(filePath)} → ${path.basename(outputPath)} (${origKb}kb → ${finalKb}kb, ${saved}% 감소, ${usedRatio} 적용)`,
  );
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
