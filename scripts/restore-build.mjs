import fs from "node:fs";
const tempDir = "./.build-exclude";
const movedFile = tempDir + "/.moved.json";
if (!fs.existsSync(movedFile)) { console.log("Nothing to restore"); process.exit(0); }
const moved = JSON.parse(fs.readFileSync(movedFile, "utf8"));
moved.forEach(src => {
    const dest = tempDir + "/" + src.replace(/[/]/g, "_");
    try { fs.renameSync(dest, src); console.log("  [restore]", src); }
    catch (e) { console.error("  [error]", src, e.message); }
});
try { fs.rmdirSync(tempDir, { recursive: true }); } catch {}
console.log("Restored", moved.length, "file(s)");
