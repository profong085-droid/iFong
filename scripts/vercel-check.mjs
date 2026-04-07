import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.VERCEL_CHECK_URL || "https://ifong.vercel.app";
const expectedContentTypes = new Set(["video/mp4", "video/quicktime", "application/octet-stream"]);
const videosDir = path.resolve(process.cwd(), "public/videos");

async function checkRemoteHeaders(videoPath) {
  const target = `${baseUrl}${videoPath.startsWith("/") ? videoPath : `/${videoPath}`}`;
  const res = await fetch(target, { method: "HEAD" });
  if (!res.ok) {
    throw new Error(`HEAD ${target} failed with status ${res.status}`);
  }

  const contentType = (res.headers.get("content-type") || "").split(";")[0].trim();
  const cacheControl = res.headers.get("cache-control") || "";
  const contentLength = Number(res.headers.get("content-length") || "0");

  return { target, contentType, cacheControl, contentLength };
}

function fileLooksLikeLfsPointer(filePath) {
  const fd = fs.openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(180);
    const bytes = fs.readSync(fd, buffer, 0, 180, 0);
    const head = buffer.subarray(0, bytes).toString("utf8");
    return head.includes("version https://git-lfs.github.com/spec/v1");
  } finally {
    fs.closeSync(fd);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  if (!fs.existsSync(videosDir)) {
    console.warn("No public/videos directory found, skipping media checks.");
    process.exit(0);
  }

  const videoFiles = fs
    .readdirSync(videosDir)
    .filter((name) => /\.(mp4|mov|webm)$/i.test(name))
    .map((name) => `/videos/${name}`);

  if (videoFiles.length === 0) {
    console.warn("No video files found in public/videos, skipping media checks.");
    process.exit(0);
  }

  for (const relative of videoFiles) {
    const absolutePath = path.resolve(process.cwd(), "public", relative.slice(1));
    assert(!fileLooksLikeLfsPointer(absolutePath), `${relative} appears to be a Git LFS pointer, not a binary.`);
    const remote = await checkRemoteHeaders(relative);
    assert(
      expectedContentTypes.has(remote.contentType),
      `${relative} has unexpected content-type "${remote.contentType}".`,
    );
    assert(remote.contentLength > 1000, `${relative} content-length looks too small (${remote.contentLength}).`);
    assert(
      remote.cacheControl.length > 0,
      `${relative} is missing cache-control header.`,
    );

    console.log(
      `OK ${relative} | content-type=${remote.contentType} | cache-control="${remote.cacheControl}" | bytes=${remote.contentLength}`,
    );
  }

  console.log(`Vercel production checks passed for ${videoFiles.length} video file(s).`);
}

run().catch((error) => {
  console.error("vercel-check failed:", error.message);
  process.exit(1);
});
