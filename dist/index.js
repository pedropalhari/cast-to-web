#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const srt_to_vtt_1 = __importDefault(require("srt-to-vtt"));
const { argv } = process;
let [_1, _2, filmPath, subPath] = argv;
/**
 * Possible future VTT manual
 */
// if (argv.includes("--vtt")) {
//   exec("xdg-open https://subtitletools.com/convert-to-vtt-online");
//   process.exit();
// }
if (!filmPath || !subPath) {
    throw "You didn't provide an absolute film or subtitle path. Check the README!";
}
let app = express_1.default();
app.get("/", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../index.html"));
});
app.get("/video", function (req, res) {
    const path = filmPath;
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
        file.pipe(res);
    }
    else {
        const head = {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
        };
        res.writeHead(200, head);
        fs_1.default.createReadStream(path).pipe(res);
    }
});
app.get("/sub", (req, res) => {
    fs_1.default.createReadStream(subPath).pipe(srt_to_vtt_1.default()).pipe(res);
});
app.listen(8080, () => {
    console.log("\n\nRunning succesfully!");
    console.log("http://localhost:8080");
});
//# sourceMappingURL=index.js.map