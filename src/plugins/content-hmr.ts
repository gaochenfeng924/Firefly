import type { AstroIntegration } from "astro";

export default function contentHmr(): AstroIntegration {
	return {
		name: "content-hmr",
		hooks: {
			"astro:config:done": ({ config }) => {
				// 添加一个 Vite 插件，在 dev 模式下暴露 Vite 服务器引用
				config.vite.plugins ??= [];
				config.vite.plugins.push({
					name: "content-hmr-vite",
					configureServer(server) {
						(globalThis as any).__viteServer = server;
					},
				});
			},
			"astro:server:done": () => {
				delete (globalThis as any).__viteServer;
			},
		},
	};
}
