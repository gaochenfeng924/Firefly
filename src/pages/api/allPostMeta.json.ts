import { getCollection } from "astro:content";

export const prerender = true;

export async function GET() {
	const allPosts = await getCollection("posts", ({ data }) => {
		return data.draft !== true;
	});

	const allPostsData = allPosts
		.map((post) => ({
			id: post.id,
			title: post.data.title || "",
			description: post.data.description || "",
			published: post.data.published
				? new Date(post.data.published).getTime()
				: 0,
			category: post.data.category || "",
			password: !!post.data.password,
		}))
		.filter((p) => p.published > 0)
		.sort((a, b) => b.published - a.published);

	return new Response(JSON.stringify(allPostsData));
}
