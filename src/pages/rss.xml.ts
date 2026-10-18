import rss from '@astrojs/rss';
import { getPosts } from '../lib/content';
import { siteConfig } from '../config';

export async function GET() {
  const posts = await getPosts();
  return rss({
    title: `${siteConfig.name}'s field notes`,
    description: siteConfig.description,
    site: siteConfig.url,
    items: posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/writing/${post.id}/`,
    })),
    customData: '<language>en</language>',
  });
}
