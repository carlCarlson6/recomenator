import * as cheerio from 'cheerio';

import type { LinkPreview } from '../domain/LinkPreview.js';
import type { LinkPreviewService } from '../application/ports/LinkPreviewService.js';

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

async function fetchSpotify(url: string): Promise<LinkPreview | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      embedHtml: data.html,
      imageUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

export class OpenGraphLinkPreviewService implements LinkPreviewService {
  async fetch(url: string): Promise<LinkPreview> {
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      return {
        embedHtml: `<iframe class="w-full aspect-video rounded-md" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
      };
    }

    const spotify = await fetchSpotify(url);
    if (spotify) return spotify;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RecomenatorBot/1.0)',
        },
      });
      if (!res.ok) return {};

      const html = await res.text();
      const $ = cheerio.load(html);
      const getMeta = (property: string) =>
        $(`meta[property="${property}"]`).attr('content') ||
        $(`meta[name="${property}"]`).attr('content');

      return {
        title: getMeta('og:title') || $('title').first().text() || undefined,
        description: getMeta('og:description') || undefined,
        imageUrl: getMeta('og:image') || undefined,
      };
    } catch {
      return {};
    }
  }
}
