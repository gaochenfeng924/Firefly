import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { APIRoute } from "astro";
async function touchContentConfig() {
	try {
		const configPath = path.resolve(process.cwd(), "src/content.config.ts");
		if (fs.existsSync(configPath)) {
			const now = new Date();
			fs.utimesSync(configPath, now, now);
		}
		try {
			const { pathToFileURL: _url } = await import("node:url");
			const url = _url(path.resolve(process.cwd(), "node_modules/astro/dist/content/instance.js"));
			const mod = await import(url.href);
			if (mod?.globalContentLayer?.sync) await mod.globalContentLayer.sync();
		} catch {}
		try {
			const server = globalThis.__viteServer;
			if (server?.environments?.client?.hot) {
				const runner = server.environments.ssr?.runner || server.environments.server?.runner;
				if (runner?.evaluatedModules) {
					const entries = [...runner.evaluatedModules.entries()];
					for (const [id, mod] of entries) {
						if (typeof id === "string" && (id.includes("content") || id.includes("data-store") || id.includes("virtual"))) {
							runner.evaluatedModules.invalidateModule(mod);
						}
					}
				}
				server.environments.client.hot.send({ type: "full-reload", path: "*" });
			}
		} catch {}
	} catch {}
}


export const prerender = false;

interface ParsedSpec {
	name: string;
	fileName: string;
}

export const GET: APIRoute = async () => {
	if (import.meta.env.PROD) {
		return new Response(JSON.stringify({ error: "管理面板仅限开发环境使用" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const specDir = path.resolve(process.cwd(), "src/content/spec");
	const items: ParsedSpec[] = [];

	if (fs.existsSync(specDir)) {
		const files = fs.readdirSync(specDir);
		for (const file of files) {
			if (!/\.(md|mdx)$/i.test(file)) continue;
			const name = file.replace(/\.(md|mdx)$/i, "");
			items.push({ name, fileName: file });
		}
	}

	return new Response(JSON.stringify(items), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
