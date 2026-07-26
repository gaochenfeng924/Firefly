// fb = 一键发布：提交 admin-panel 所有改动 → 同步到 master → 推送
import { execSync } from "node:child_process";

function run(cmd, silent = false) {
	if (!silent) console.log(`> ${cmd}`);
	return execSync(cmd, { encoding: "utf-8", cwd: process.cwd() }).trim();
}

try {
	const branch = run("git symbolic-ref --short HEAD");
	if (branch !== "admin-panel") {
		console.log("❌ 请在 admin-panel 分支下运行");
		process.exit(1);
	}

	// 1. 提交 admin-panel 上所有未提交的改动
	const hasChanges = run("git status --porcelain", true);
	if (hasChanges) {
		console.log("📦 提交 admin-panel 的所有改动...");
		run('git add -A');
		run('git commit -m "chore: 更新"');
		run("git push origin admin-panel");
	} else {
		console.log("ℹ️  admin-panel 没有未提交的改动");
	}

	// 2. 同步到 master 并推送
	console.log("🔀 切换到 master...");
	run("git checkout master");

	// 同步所有文件（内容 + 配置，不含管理面板代码）
	console.log("📋 从 admin-panel 同步更改...");
	try {
		const masterFiles = run("git ls-tree -r master --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const adminFiles = run("git ls-tree -r admin-panel --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const toDelete = masterFiles.filter(f => !adminFiles.includes(f));
		for (const f of toDelete) {
			try { run(`git rm --quiet "${f}"`, true); } catch {}
		}
	} catch {}
	run("git checkout admin-panel -- src/content/ src/config/");

	// 提交并推送 master
	run("git add -A");
	try {
		run('git commit -m "chore: 同步更新"');
		console.log("🚀 推送到 GitHub...");
		run("git push origin master");
		console.log("🎉 发布成功！");
	} catch {
		console.log("ℹ️  没有新更改");
	}

	// 3. 切回 admin-panel
	console.log("🔙 切回 admin-panel...");
	run("git checkout admin-panel");
	console.log("✅ 完成");
} catch (e) {
	console.error("❌ 出错:", e.message);
	process.exit(1);
}
