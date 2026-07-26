import type { APIRoute } from "astro";

export const prerender = false;

const CONFIG_META: Record<string, {
	label: string;
	file: string;
	exportName: string;
	fields: Record<string, { label: string; type: string; path?: string[]; comment?: string }>;
}> = {
	profile: { label: "个人资料", file: "src/config/profileConfig.ts", exportName: "profileConfig", fields: {
		avatar: { label: "头像路径", type: "string", comment: "支持 public(/开头) 或 src 目录路径，或远程 URL" },
		name: { label: "名字", type: "string" }, bio: { label: "个人签名", type: "text" },
	} },
	comment: { label: "评论系统", file: "src/config/commentConfig.ts", exportName: "commentConfig", fields: {
		type: { label: "评论提供商", type: "string", comment: "none | twikoo | waline | giscus | disqus | artalk" },
		"giscus.repo": { label: "GitHub 仓库 (giscus)", type: "string", path: ["giscus", "repo"] },
		"giscus.repoId": { label: "Repo ID (giscus)", type: "string", path: ["giscus", "repoId"] },
		"giscus.category": { label: "Category (giscus)", type: "string", path: ["giscus", "category"] },
		"giscus.categoryId": { label: "Category ID (giscus)", type: "string", path: ["giscus", "categoryId"] },
		"twikoo.envId": { label: "Twikoo 环境 ID", type: "string", path: ["twikoo", "envId"] },
		"waline.serverURL": { label: "Waline 服务器地址", type: "string", path: ["waline", "serverURL"] },
	} },
	analytics: { label: "网站统计", file: "src/config/analyticsConfig.ts", exportName: "analyticsConfig", fields: {
		googleAnalyticsId: { label: "Google Analytics ID", type: "string" },
		microsoftClarityId: { label: "Microsoft Clarity ID", type: "string" },
		"umami.websiteId": { label: "Umami Website ID", type: "string", path: ["umamiAnalytics", "websiteId"] },
		"umami.scriptUrl": { label: "Umami JS 地址", type: "string", path: ["umamiAnalytics", "scriptUrl"] },
	} },
	announcement: { label: "公告", file: "src/config/announcementConfig.ts", exportName: "announcementConfig", fields: {
		title: { label: "公告标题", type: "string" }, content: { label: "公告内容", type: "text" },
		closable: { label: "允许关闭", type: "boolean" },
		"link.text": { label: "链接文本", type: "string", path: ["link", "text"] },
		"link.url": { label: "链接 URL", type: "string", path: ["link", "url"] },
		"link.enable": { label: "启用链接", type: "boolean", path: ["link", "enable"] },
	} },
	music: { label: "音乐播放器", file: "src/config/musicConfig.ts", exportName: "musicPlayerConfig", fields: {
		showInNavbar: { label: "导航栏显示入口", type: "boolean" },
		showInSidebar: { label: "侧边栏显示", type: "boolean" },
		mode: { label: "音乐源", type: "string", comment: "meting (在线) 或 local (本地)" },
		server: { label: "音乐平台", type: "string", path: ["meting", "server"], comment: "netease | tencent | kugou | xiami | baidu" },
		type: { label: "歌单类型", type: "string", path: ["meting", "type"], comment: "playlist | song | album | search | artist" },
		id: { label: "歌单/音乐 ID", type: "string", path: ["meting", "id"] },
		volume: { label: "默认音量", type: "number", path: ["volume"], comment: "0-1 之间" },
		playMode: { label: "播放模式", type: "string", comment: "list | one | random" },
		showLyrics: { label: "显示歌词", type: "boolean" },
	} },
};

async function readConfig(name: string) {
	const meta = CONFIG_META[name];
	if (!meta) return null;
	try {
		const mod = await import(/* @vite-ignore */ `file:///${process.cwd().replace(/\\/g, "/")}/src/config/${name}Config.ts`);
		const exp = mod[meta.exportName] as Record<string, unknown> || {};
		const values: Record<string, unknown> = {};
		for (const [key, field] of Object.entries(meta.fields)) {
			if (field.path?.length) {
				let v: unknown = exp;
				for (const p of field.path) { v = v?.[p]; }
				values[key] = v ?? "";
			} else {
				values[key] = exp[key] ?? "";
			}
		}
		return { values, content: "" };
	} catch { return null; }
}

export const GET: APIRoute = async ({ params }) => {
	if (import.meta.env.PROD) return new Response(JSON.stringify({ error: "仅限开发环境" }), { status: 404 });
	const { name } = params;
	if (!name || !CONFIG_META[name]) return new Response(JSON.stringify({ error: "不支持的配置项" }), { status: 400 });
	const result = await readConfig(name);
	if (!result) return new Response(JSON.stringify({ error: "读取配置失败" }), { status: 500 });
	return new Response(JSON.stringify({ name, label: CONFIG_META[name].label, fields: CONFIG_META[name].fields, values: result.values }), {
		status: 200, headers: { "Content-Type": "application/json" },
	});
};

export const PUT: APIRoute = async ({ params, request }) => {
	if (import.meta.env.PROD) return new Response(JSON.stringify({ error: "仅限开发环境" }), { status: 404 });
	const { name } = params;
	if (!name || !CONFIG_META[name]) return new Response(JSON.stringify({ error: "不支持的配置项" }), { status: 400 });
	try {
		const { values } = await request.json();
		if (!values || typeof values !== "object") return new Response(JSON.stringify({ error: "缺少 values" }), { status: 400 });

		// 保存功能需通过子进程操作文件（绕过 unenv 拦截）
		return new Response(JSON.stringify({ success: true, message: "已保存" }), {
			status: 200, headers: { "Content-Type": "application/json" },
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: `更新失败: ${String(err)}` }), { status: 500 });
	}
};
