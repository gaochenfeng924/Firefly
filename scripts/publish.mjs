import { execSync } from "node:child_process";

function run(cmd) {
	console.log(`> ${cmd}`);
	return execSync(cmd, { encoding: "utf-8", cwd: process.cwd() }).trim();
}

try {
	const branch = run("git symbolic-ref --short HEAD");
	if (branch !== "admin-panel") {
		console.log("❌ 请在 admin-panel 分支下运行此脚本");
		process.exit(1);
	}

	try { run('git stash push -m "publish-auto-stash"'); } catch {}

	console.log("🔀 切换到 master...");
	run("git checkout master");

	console.log("📋 同步所有更改（content + config）...");
	try {
		const masterFiles = run("git ls-tree -r master --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const adminFiles = run("git ls-tree -r admin-panel --name-only -- src/content/ src/config/").split("\n").filter(Boolean);
		const toDelete = masterFiles.filter(f => !adminFiles.includes(f));
		for (const f of toDelete) {
			try { run(`git rm --quiet "${f}"`); } catch {}
		}
	} catch {}
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
