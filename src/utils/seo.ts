export function applyPageSeo(metadata: { title: string; description: string; canonical: string; image?: string; index: boolean; schema: Record<string, unknown>[] }) {
  document.title = metadata.title;
  const meta = (attribute: 'name' | 'property', key: string, value: string) => {
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
    if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); }
    element.content = value;
  };
  meta('name', 'description', metadata.description);
  meta('name', 'robots', metadata.index ? 'index,follow' : 'noindex,follow');
  meta('property', 'og:title', metadata.title);
  meta('property', 'og:description', metadata.description);
  meta('property', 'og:url', metadata.canonical);
  meta('property', 'og:type', new URL(metadata.canonical).pathname.startsWith('/journal/') ? 'article' : 'website');
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', metadata.title);
  meta('name', 'twitter:description', metadata.description);
  meta('name', 'twitter:image', metadata.image ? new URL(metadata.image, 'https://www.glowwithsh.com').href : '');
  meta('property', 'og:image', metadata.image ? new URL(metadata.image, 'https://www.glowwithsh.com').href : '');
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  canonical.href = metadata.canonical;
  document.head.querySelectorAll('script[data-page-seo]').forEach(script => script.remove());
  metadata.schema.forEach(schema => {
    const script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.pageSeo = 'true';
    script.textContent = JSON.stringify(schema); document.head.appendChild(script);
  });
}
