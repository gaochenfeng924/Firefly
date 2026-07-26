// 启动前自动恢复文章和动态文件（如果被误删）
import { execSync } from "node:child_process";

const dirs = ["src/content/posts", "src/content/dynamic"];

for (const dir of dirs) {
	try {
		const files = execSync(`git ls-tree -r HEAD --name-only -- "${dir}"`, {
			encoding: "utf-8",
			cwd: process.cwd(),
		}).split("\n").filter(Boolean);

		if (files.length === 0) continue;

		// 检查本地是否有文件
		const localHasFiles = execSync(`dir /b "${dir}\\*.md" 2>nul || echo empty`, {
			encoding: "utf-8",
			cwd: process.cwd(),
			shell: true,
		}).trim() !== "empty";

		if (!localHasFiles) {
			console.log(`📂 恢复 ${dir} 的内容...`);
			execSync(`git checkout HEAD -- "${dir}"`, { cwd: process.cwd() });
			console.log(`✅ ${dir} 已恢复 (${files.length} 个文件)`);
		}
	} catch {
		// 目录不存在或没有 git 跟踪
	}
}
