import fs from "node:fs";
import path from "node:path";

function parseFrontmatter(content: string) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return {};
	const frontmatter: Record<string, unknown> = {};
	for (const line of match[1].split("\n")) {
		const kv = line.match(/^\s*(\w+)\s*:\s*(.+)/);
		if (kv) {
			let val: unknown = kv[2].trim();
			if ((val as string).startsWith("[")) val = (val as string).slice(1, -1).split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
			else if (val === "true") val = true;
			else if (val === "false") val = false;
			else if (/^\d+$/.test(val as string)) val = parseInt(val as string);
			else val = (val as string).replace(/^["']|["']$/g, "");
			frontmatter[kv[1]] = val;
		}
	}
	return frontmatter;
}

function walkDir(dir: string): string[] {
	const results: string[] = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) results.push(...walkDir(full));
		else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) results.push(full);
	}
	return results;
}

export async function GET() {
	const postsDir = path.resolve(process.cwd(), "src/content/posts");
	const files = walkDir(postsDir);

	const allPostsData = files
		.map((fp) => {
			const content = fs.readFileSync(fp, "utf-8");
			const meta = parseFrontmatter(content);
			const relPath = path.relative(postsDir, fp).replace(/\\/g, "/").replace(/\.(md|mdx)$/i, "");
			return {
				id: relPath,
				title: meta.title || "",
				description: meta.description || "",
				published: meta.published ? new Date(meta.published as string).getTime() : 0,
				category: meta.category || "",
				password: !!meta.password,
			};
		})
		.filter((p) => p.published > 0)
		.sort((a, b) => b.published - a.published);

	return new Response(JSON.stringify(allPostsData));
}
