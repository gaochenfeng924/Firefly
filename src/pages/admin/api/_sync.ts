import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function syncContent(metaUrl: string) {
	try {
		const root = fileURLToPath(new URL("../../../../..", metaUrl));

		// 1. 改变 content.config.ts 时间戳 → 触发 Astro 的配置监听器
		const configPath = path.resolve(root, "src/content.config.ts");
		if (fs.existsSync(configPath)) fs.utimesSync(configPath, new Date(), new Date());

		// 2. 删除数据缓存 → 下次请求强制从磁盘重建
		const dataStore = path.resolve(root, ".astro/data-store.json");
		if (fs.existsSync(dataStore)) fs.unlinkSync(dataStore);

		// 3. 浏览器全量刷新
		const server = (globalThis as any).__viteServer as any;
		if (server?.environments?.client?.hot) {
			// 失效全部 SSR 模块
			const runner = server.environments.ssr?.runner || server.environments.server?.runner;
			if (runner?.evaluatedModules) {
				for (const [, mod] of [...runner.evaluatedModules.entries()]) {
					if (mod?.url) runner.evaluatedModules.invalidateModule(mod);
				}
			}
			server.environments.client.hot.send({ type: "full-reload", path: "*" });
		}
	} catch {}
}
