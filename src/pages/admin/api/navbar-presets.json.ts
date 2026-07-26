import fs from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";

interface NavLinkItem {
	key: string;
	name: string;
	url: string;
	icon: string;
	pageKey?: string;
	enabled?: boolean;
	mainMenu?: string;
}

export const GET: APIRoute = async () => {
	if (import.meta.env.PROD) {
		return new Response(JSON.stringify({ error: "管理面板仅限开发环境使用" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	const configPath = path.resolve(process.cwd(), "src/config/navBarConfig.ts");
	const siteConfigPath = path.resolve(process.cwd(), "src/config/siteConfig.ts");

	try {
		const navUrl = `file:///${configPath.replace(/\\/g, "/")}`;
		const siteUrl = `file:///${siteConfigPath.replace(/\\/g, "/")}`;
		const navModule = await import(/* @vite-ignore */ navUrl);
		const siteModule = await import(/* @vite-ignore */ siteUrl);
		const presets: Record<string, unknown> = navModule.LinkPresets || {};
		const siteConfig = siteModule.siteConfig || {};
		const pageToggles = siteConfig.pages || {};

		const items: NavLinkItem[] = [];
		for (const [key, val] of Object.entries(presets)) {
			if (val && typeof val === "object") {
				const v = val as Record<string, string>;
				const pageKey = v.pageKey;
				// pageKey 对应 siteConfig.pages 的开关，或者默认启用
				const enabled = pageKey ? pageToggles[pageKey] !== false : true;
				items.push({
					key,
					name: v.name || key,
					url: v.url || "/",
					icon: v.icon || "",
					pageKey,
					enabled,
				});
			}
		}

		return new Response(JSON.stringify({ items, pageToggles }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const PUT: APIRoute = async ({ request }) => {
	if (import.meta.env.PROD) {
		return new Response(JSON.stringify({ error: "管理面板仅限开发环境使用" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const body = await request.json();
		const { key, name, url, enabled } = body as { key: string; name?: string; url?: string; enabled?: boolean; pageKey?: string };

		if (!key) {
			return new Response(JSON.stringify({ error: "缺少 key 参数" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const navPath = path.resolve(process.cwd(), "src/config/navBarConfig.ts");
		let content = fs.readFileSync(navPath, "utf-8");

		// 如果传了 enabled，切换页面开关
		if (enabled !== undefined) {
			const siteConfigPath = path.resolve(process.cwd(), "src/config/siteConfig.ts");
			let siteContent = fs.readFileSync(siteConfigPath, "utf-8");
			// 查找 key 对应的 pageKey
			const pageKeyMatch = content.match(new RegExp(`${key}\\s*:\\s*\\{[^}]*?pageKey:\\s*"([^"]+)"`));
			if (pageKeyMatch) {
				const pageKey = pageKeyMatch[1];
				// 匹配 pageKey: true 或 pageKey: false（跳过注释行）
				const lines = siteContent.split("\n");
				let changed = false;
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i].trim();
					// 如果该行没有注释，且匹配 key: true/false
					if (line.startsWith(`${pageKey}:`) || line.startsWith(`${pageKey} :`)) {
						lines[i] = lines[i].replace(/(:\s*)(true|false)/, `$1${enabled ? "true" : "false"}`);
						changed = true;
						break;
					}
				}
				if (changed) {
					fs.writeFileSync(siteConfigPath, lines.join("\n"), "utf-8");
				}
			}
		}

		// 更新 name 和 url
		if (name !== undefined) {
			const nameRegex = new RegExp(`(${key}\\s*:\\s*\\{[^}]*?name\\s*:\\s*")[^"]*(")`, "s");
			content = content.replace(nameRegex, `$1${name.replace(/"/g, '\\"')}$2`);
		}
		if (url !== undefined) {
			const urlRegex = new RegExp(`(${key}\\s*:\\s*\\{[^}]*?url\\s*:\\s*")[^"]*(")`, "s");
			content = content.replace(urlRegex, `$1${url.replace(/"/g, '\\"')}$2`);
		}

		fs.writeFileSync(navPath, content, "utf-8");

		return new Response(JSON.stringify({ success: true, message: "导航链接已更新" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: `更新失败: ${String(err)}` }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};

export const prerender = false;
