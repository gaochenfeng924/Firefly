// 启动前自动恢复文章和动态文件（如果被误删）
import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const dirs = ["src/content/posts", "src/content/dynamic"];

for (const dir of dirs) {
	try {
		const files = execSync(`git ls-tree -r HEAD --name-only -- "${dir}"`, {
			encoding: "utf-8",
			cwd: root,
		}).split("\n").filter(Boolean);

		if (files.length === 0) continue;

		const fullDir = resolve(root, dir);
		if (!existsSync(fullDir)) mkdirSync(fullDir, { recursive: true });

		// 检查目录中是否有 .md 文件
		const localFiles = existsSync(fullDir)
			? readdirSync(fullDir).filter(f => f.endsWith(".md") && f !== ".gitkeep")
			: [];

		if (localFiles.length === 0) {
			console.log(`📂 恢复 ${dir} 的内容...`);
			execSync(`git checkout HEAD -- "${dir}"`, { cwd: root });
			console.log(`✅ ${dir} 已恢复 (${files.length} 个文件)`);
		}

		// 删除空文件或无效文件（避免 empty frontmatter 崩溃）
		if (existsSync(fullDir)) {
			for (const f of readdirSync(fullDir)) {
				if (!f.endsWith(".md") || f === ".gitkeep") continue;
				const fp = resolve(fullDir, f);
				try {
					const content = readFileSync(fp, "utf-8");
					if (content.length === 0 || !content.includes("---")) {
						rmSync(fp);
						console.log(`🧹 删除无效文件: ${dir}/${f}`);
					}
				} catch {
					rmSync(fp);
					console.log(`🧹 删除损坏文件: ${dir}/${f}`);
				}
			}
		}
	} catch (e) {
		// 目录不存在或 Git 出错，忽略
	}
}
