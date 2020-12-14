import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import srt2vtt from "srt-to-vtt";

const { argv } = process;
let [_1, _2, filmPath, subPath] = argv;

/**
 * Possible future VTT manual 
 */
// if (argv.includes("--vtt")) {
//   exec("xdg-open https://subtitletools.com/convert-to-vtt-online");
//   process.exit();
// }

let app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/video", function (req, res) {
  const path = filmPath;
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(path, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

app.get("/sub", (req, res) => {
  fs.createReadStream(subPath).pipe(srt2vtt()).pipe(res);
});

app.listen(8080, () => {
  console.log("http://localhost:8080");
});
