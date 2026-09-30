import { useEffect } from 'react';

const setMeta = (selector: string, value: string) => {
  const element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (element) element.content = value;
};

export function usePageSeo({ title, description, canonical, image, schema }: { title: string; description: string; canonical: string; image?: string; schema?: Record<string, unknown> }) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    if (image) setMeta('meta[property="og:image"]', image);
    const link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (link) link.href = canonical;
    let script: HTMLScriptElement | undefined;
    if (schema) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageSeo = 'true';
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, canonical, image, schema]);
}
