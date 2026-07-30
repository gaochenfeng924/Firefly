import fs from "node:fs";
import path from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";

const markdownImagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["']([^"']*)["'])?\)/g;

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return { frontmatter: {}, body: content };
	const frontmatter: Record<string, unknown> = {};
	for (const line of match[1].split("\n")) {
		const kv = line.match(/^\s*(\w+)\s*:\s*(.+)/);
		if (kv) {
			let val: unknown = kv[2].trim();
			if (typeof val === "string" && val.startsWith("[")) {
				val = val.slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
			} else if (val === "true") val = true;
			else if (val === "false") val = false;
			else if (typeof val === "string" && /^\d+$/.test(val)) val = parseInt(val, 10);
			else if (typeof val === "string") val = val.replace(/^["']|["']$/g, "");
			frontmatter[kv[1]] = val;
		}
	}
	return { frontmatter, body: match[2] };
}

export async function GET() {
	const dynamicDir = path.resolve(process.cwd(), "src/content/dynamic");
	const processor = await createMarkdownProcessor();

	let files: string[] = [];
	if (fs.existsSync(dynamicDir)) {
		files = fs.readdirSync(dynamicDir)
			.filter(f => f.endsWith(".md") && f !== ".gitkeep")
			.sort()
			.reverse();
	}

	const data = await Promise.all(
		files.map(async (fileName) => {
			const filePath = path.join(dynamicDir, fileName);
			const content = fs.readFileSync(filePath, "utf-8");
			const { frontmatter, body } = parseFrontmatter(content);
			const slug = fileName.replace(/\.md$/i, "");

			// 提取图片
			const images: Array<{ alt: string; src: string; title?: string }> = [];
			const mdWithoutImages = (body || "").replace(
				markdownImagePattern,
				(_match: string, alt: string, src: string, title?: string) => {
					images.push({ alt, src, ...(title ? { title } : {}) });
					return "";
				},
			);
			const rendered = await processor.render(mdWithoutImages);

			const published = frontmatter.published
				? new Date(frontmatter.published as string).getTime()
				: 0;

			return {
				id: slug,
				published,
				html: rendered.code,
				images,
				searchText: (body || "").toLocaleLowerCase(),
				pinned: frontmatter.pinned === true,
			};
		}),
	);

	// 排序：置顶优先，然后按发布时间降序
	data.sort((a, b) => {
		if (a.pinned && !b.pinned) return -1;
		if (!a.pinned && b.pinned) return 1;
		return b.published - a.published;
	});

	return new Response(JSON.stringify(data), {
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}
