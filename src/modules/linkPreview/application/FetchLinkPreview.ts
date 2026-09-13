import type { LinkPreview } from '../domain/LinkPreview.js';
import type { LinkPreviewService } from './ports/LinkPreviewService.js';

export async function fetchLinkPreview(
  url: string,
  deps: { linkPreviewService: LinkPreviewService },
): Promise<LinkPreview> {
  return deps.linkPreviewService.fetch(url);
}
