/** Resize only a known image service; preserve all merchant upload/CDN URLs. */
export function responsiveImage(source: string, sizes: string, width = 640) {
  try {
    const url = new URL(source);
    if (url.hostname !== 'images.unsplash.com') return { src: source, decoding: 'async' as const };
    const variant = (pixels: number) => {
      const image = new URL(url);
      image.searchParams.set('w', String(pixels));
      image.searchParams.set('q', '70');
      image.searchParams.set('auto', 'format');
      return image.href;
    };
    return { src: variant(width), srcSet: [320, 640, 960, 1280].map(pixels => `${variant(pixels)} ${pixels}w`).join(', '), sizes, decoding: 'async' as const };
  } catch { return { src: source, decoding: 'async' as const }; }
}
