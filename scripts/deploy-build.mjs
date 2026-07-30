import fs from "node:fs";
const excludeList = ["src/pages/admin", "src/pages/rss.xml.ts", "src/pages/rss.astro"];
const tempDir = "./.build-exclude";
const moved = [];
function mv(s, d) { try { fs.renameSync(s, d); return true; } catch { return false; } }
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
for (const item of excludeList) {
    if (fs.existsSync(item)) {
        const dest = tempDir + "/" + item.replace(/[/]/g, "_");
        if (mv(item, dest)) { moved.push(item); console.log("  [exclude]", item); }
    }
}
if (moved.length > 0) {
    fs.writeFileSync(tempDir + "/.moved.json", JSON.stringify(moved));
    console.log("Moved", moved.length, "file(s)");
}
