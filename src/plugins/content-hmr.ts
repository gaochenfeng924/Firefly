import type { AstroIntegration } from "astro";

export default function contentHmr(): AstroIntegration {
	return {
		name: "content-hmr",
		hooks: {
			"server:start": ({ server }) => {
				// 把 Vite 服务器引用存到全局，让 API 端点可以触发 HMR
				(globalThis as any).__viteServer = server;
			},
			"server:done": () => {
				delete (globalThis as any).__viteServer;
			},
		},
	};
}
