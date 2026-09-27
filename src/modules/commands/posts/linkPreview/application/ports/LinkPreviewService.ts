import type { LinkPreview } from '../../domain/LinkPreview.js';

export interface LinkPreviewService {
  fetch(url: string): Promise<LinkPreview>;
}
