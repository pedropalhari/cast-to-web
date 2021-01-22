#!/usr/bin/env node
import express from "express";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { exec } from "child_process";
import srt2vtt from "srt-to-vtt";

const { argv } = process;
let [_1, _2, rootDirFromArgs, subPath] = argv;

let rootDir = process.cwd();

if (rootDirFromArgs) {
  rootDir = rootDirFromArgs;
}

// if (!filmPath || !subPath) {
//   throw "You didn't provide an absolute film or subtitle path. Check the README!";
// }

let app = express();

/**
 * sort-of static files
 */
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/watch", (req, res) => {
  return res.sendFile(path.join(__dirname, "../watch.html"));
});

app.get("/placeholder.png", async (req, res) => {
  return res.sendFile(path.join(__dirname, "../placeholder.png"));
});

// Routes

app.get("/path", async (req, res) => {
  let films = await scanDirectory();

  return res.json({ films });
});

app.get("/video/:filmPath", function (req, res) {
  const path = decodeURIComponent(req.params.filmPath);
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
    return file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    return fs.createReadStream(path).pipe(res);
  }
});

app.get("/sub/:subPath", (req, res) => {
  return fs
    .createReadStream(decodeURIComponent(req.params.subPath))
    .pipe(srt2vtt())
    .pipe(res);
});

app.listen(8080, () => {
  console.log("\n\nRunning succesfully!");
  console.log("http://localhost:8080");
});

interface Film {
  name: string;
  filmPath: string | null;
  subPath: string | null;
  imagePath: string | null;
}

async function scanDirectory() {
  let filmFolders = fs.readdirSync(rootDir);

  let films = await Promise.all<Film>(
    filmFolders.map(async (filmName) => {
      let folderContents = await fsPromises.readdir(
        path.join(rootDir, filmName)
      );

      // Find the files
      let filmPathFileName = folderContents.find((content) =>
        content.includes(".mp4")
      );

      let subPathFileName = folderContents.find((content) =>
        content.includes(".srt")
      );

      let imagePathFileName = folderContents.find((content) =>
        content.includes(".png")
      );

      let filmPath = null;
      let subPath = null;
      let imagePath = null;

      if (filmPathFileName) {
        filmPath = path.join(rootDir, filmName, filmPathFileName);
      }

      if (subPathFileName) {
        subPath = path.join(rootDir, filmName, subPathFileName);
      }

      if (imagePathFileName) {
        imagePath = path.join(rootDir, filmName, imagePathFileName);
      }

      let film: Film = {
        name: filmName,
        filmPath,
        subPath,
        imagePath,
      };

      // Makes them all absolute paths
      return film;
    })
  );

  // Filter missing films
  films = films.filter((f) => f.filmPath);

  return films;
}
