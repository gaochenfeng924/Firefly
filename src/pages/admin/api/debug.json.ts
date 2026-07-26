import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
	const server = (globalThis as any).__viteServer;
	return new Response(JSON.stringify({
		hasServer: !!server,
		hasWs: !!(server?.environments?.client?.hot),
	}));
};
