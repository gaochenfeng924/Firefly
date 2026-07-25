// 一键发布脚本：将 admin-panel 的内容变更同步到 master 并推送
// 用法：node scripts/publish.mjs
import { execSync } from "node:child_process";

function run(cmd) {
	console.log(`> ${cmd}`);
	const result = execSync(cmd, { encoding: "utf-8", cwd: process.cwd() });
	return result.trim();
}

try {
	const branch = run("git symbolic-ref --short HEAD");
	if (branch !== "admin-panel") {
		console.log("❌ 请在 admin-panel 分支下运行此脚本");
		process.exit(1);
	}

	// 暂存未提交的更改
	try { run('git stash push -m "publish-auto-stash"'); } catch {}

	console.log("🔀 切换到 master...");
	run("git checkout master");

	console.log("📋 同步内容和配置...");
	// 先删除 master 上存在但 admin-panel 上不存在的文件（处理删除操作）
	try {
		const masterFiles = run("git ls-tree -r master --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const adminFiles = run("git ls-tree -r admin-panel --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const toDelete = masterFiles.filter(f => !adminFiles.includes(f));
		for (const f of toDelete) {
			try { run(`git rm --quiet "${f}"`); } catch {}
		}
	} catch {}
	// 从 admin-panel 复制文件（覆盖 + 新增）
	run("git checkout admin-panel -- src/content/ src/config/");

	console.log("✅ 提交...");
	run("git add -A");
	try {
		run('git commit -m "chore: 同步内容更新"');
		console.log("🚀 推送到 GitHub...");
		run("git push origin master");
		console.log("🎉 发布成功！Cloudflare 将自动部署");
	} catch {
		console.log("ℹ️  没有新更改");
	}

	console.log("🔙 切回 admin-panel...");
	run("git checkout admin-panel");
	try { run("git stash pop"); } catch {}

	console.log("✅ 完成");
} catch (e) {
	console.error("❌ 出错:", e.message);
	process.exit(1);
}
