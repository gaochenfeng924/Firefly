import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

export async function syncContent(metaUrl: string) {
	try {
		// 用调用者的 import.meta.url 定位项目根目录
		const callerRoot = fileURLToPath(new URL("../../../..", metaUrl));

		// 1. 更新 content.config.ts 时间戳
		const configPath = path.resolve(callerRoot, "src/content.config.ts");
		if (fs.existsSync(configPath)) {
			const now = new Date();
			fs.utimesSync(configPath, now, now);
		}

		// 2. 直接调用 Astro 的内容层同步
		try {
			const instancePath = path.resolve(callerRoot, "node_modules/astro/dist/content/instance.js");
			// @vite-ignore
			const mod = await import(/* @vite-ignore */ pathToFileURL(instancePath).href);
			if (mod?.globalContentLayer?.sync) {
				await mod.globalContentLayer.sync();
			}
		} catch {}

		// 3. Vite 模块失效 + 浏览器全量刷新
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
