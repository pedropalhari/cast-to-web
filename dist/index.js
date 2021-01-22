#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const srt_to_vtt_1 = __importDefault(require("srt-to-vtt"));
const { argv } = process;
let [_1, _2, rootDirFromArgs, subPath] = argv;
let rootDir = process.cwd();
if (rootDirFromArgs) {
    rootDir = rootDirFromArgs;
}
// if (!filmPath || !subPath) {
//   throw "You didn't provide an absolute film or subtitle path. Check the README!";
// }
let app = express_1.default();
/**
 * sort-of static files
 */
app.get("/", (req, res) => {
    return res.sendFile(path_1.default.join(__dirname, "../index.html"));
});
app.get("/watch", (req, res) => {
    return res.sendFile(path_1.default.join(__dirname, "../watch.html"));
});
app.get("/placeholder.png", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    return res.sendFile(path_1.default.join(__dirname, "../placeholder.png"));
}));
// Routes
app.get("/path", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let films = yield scanDirectory();
    return res.json({ films });
}));
app.get("/video/:filmPath", function (req, res) {
    const path = decodeURIComponent(req.params.filmPath);
    const stat = fs_1.default.statSync(path);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;
        const file = fs_1.default.createReadStream(path, { start, end });
        const head = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4",
        };
        res.writeHead(206, head);
        return file.pipe(res);
    }
    else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        return fs_1.default.createReadStream(path).pipe(res);
    }
});
app.get("/sub/:subPath", (req, res) => {
    return fs_1.default
        .createReadStream(decodeURIComponent(req.params.subPath))
        .pipe(srt_to_vtt_1.default())
        .pipe(res);
});
app.get("/img/:imagePath", (req, res) => {
    return fs_1.default
        .createReadStream(decodeURIComponent(req.params.imagePath))
        .pipe(res);
});
app.listen(8080, () => {
    console.log("\n\nRunning succesfully!");
    console.log("http://localhost:8080");
});
function scanDirectory() {
    return __awaiter(this, void 0, void 0, function* () {
        let filmFolders = fs_1.default.readdirSync(rootDir);
        let films = yield Promise.all(filmFolders.map((filmName) => __awaiter(this, void 0, void 0, function* () {
            let folderContents = yield promises_1.default.readdir(path_1.default.join(rootDir, filmName));
            // Find the files
            let filmPathFileName = folderContents.find((content) => content.includes(".mp4"));
            let subPathFileName = folderContents.find((content) => content.includes(".srt"));
            let imagePathFileName = folderContents.find((content) => content.includes(".png") ||
                content.includes(".jpg") ||
                content.includes(".jpeg"));
            let filmPath = null;
            let subPath = null;
            let imagePath = null;
            if (filmPathFileName) {
                filmPath = path_1.default.join(rootDir, filmName, filmPathFileName);
            }
            if (subPathFileName) {
                subPath = path_1.default.join(rootDir, filmName, subPathFileName);
            }
            if (imagePathFileName) {
                imagePath = path_1.default.join(rootDir, filmName, imagePathFileName);
            }
            let film = {
                name: filmName,
                filmPath,
                subPath,
                imagePath,
            };
            // Makes them all absolute paths
            return film;
        })));
        // Filter missing films
        films = films.filter((f) => f.filmPath);
        return films;
    });
}
//# sourceMappingURL=index.js.map