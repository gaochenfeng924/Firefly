import fs from "node:fs";
import path from "node:path";
import type { APIRoute } from "astro";
import { syncContent } from "../_sync";


export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	if (import.meta.env.PROD) {
		return new Response(JSON.stringify({ error: "管理面板仅限开发环境使用" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	try {
		const body = await request.json();
		const { content = "" } = body;

		const dynamicDir = path.resolve(process.cwd(), "src/content/dynamic");
		if (!fs.existsSync(dynamicDir)) {
			fs.mkdirSync(dynamicDir, { recursive: true });
		}

		const now = new Date();
		const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
		const published = (() => {
			const offset = -now.getTimezoneOffset();
			const pad = (n: number) => String(n).padStart(2, "0");
			const y = now.getFullYear();
			const M = pad(now.getMonth() + 1);
			const d = pad(now.getDate());
			const h = pad(now.getHours());
			const m = pad(now.getMinutes());
			const s = pad(now.getSeconds());
			const tz = `${offset >= 0 ? "+" : "-"}${pad(Math.abs(offset) / 60)}:${pad(Math.abs(offset) % 60)}`;
			return `${y}-${M}-${d}T${h}:${m}:${s}${tz}`;
		})();

		const fileName = `${timestamp}.md`;
		const filePath = path.resolve(process.cwd(), "src/content/dynamic", fileName);

		const frontmatter = `---\npublished: ${published}\npinned: ${body.pinned || false}\n---\n`;
		const fullContent = `${frontmatter}${content}\n`;

		fs.writeFileSync(filePath, fullContent, "utf-8");
		await syncContent(import.meta.url);

		return new Response(
			JSON.stringify({ success: true, slug: timestamp, fileName, message: "动态创建成功" }),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (err) {
		return new Response(
			JSON.stringify({ error: `创建失败: ${String(err)}` }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
};
