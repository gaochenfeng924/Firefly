import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

export async function syncContent(metaUrl: string) {
	try {
		const callerRoot = fileURLToPath(new URL("../../../../..", metaUrl));

		// 1. 更新内容配置时间戳
		const configPath = path.resolve(callerRoot, "src/content.config.ts");
		if (fs.existsSync(configPath)) fs.utimesSync(configPath, new Date(), new Date());

		// 2. 触摸内容目录，确保文件监听器检测到变化
		const now = new Date();
		for (const dir of ["src/content/posts", "src/content/dynamic"]) {
			const p = path.resolve(callerRoot, dir);
			if (fs.existsSync(p)) {
				try { fs.utimesSync(p, now, now); } catch {}
			}
		}

		// 3. 直接调用 Astro 的内容层同步
		try {
			const instancePath = path.resolve(callerRoot, "node_modules/astro/dist/content/instance.js");
			const mod = await import(/* @vite-ignore */ pathToFileURL(instancePath).href);
			if (mod?.globalContentLayer?.sync) {
				await mod.globalContentLayer.sync();
			}
		} catch {}

		// 4. Vite HMR 全量刷新
		try {
			const server = (globalThis as any).__viteServer as any;
			if (server?.environments?.client?.hot) {
				const runner = server.environments.ssr?.runner || server.environments.server?.runner;
				if (runner?.evaluatedModules) {
					for (const [, mod] of [...runner.evaluatedModules.entries()]) {
						if (mod?.url) runner.evaluatedModules.invalidateModule(mod);
					}
				}
				server.environments.client.hot.send({ type: "full-reload", path: "*" });
			}
		} catch {}
	} catch {}
}
