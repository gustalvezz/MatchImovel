import { useEffect } from 'react';

const BASE_URL = 'https://matchimovel.com.br';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

const DEFAULTS = {
  title: 'MatchImóvel | O imóvel ideal te encontra',
  description: 'MatchImovel - A nova forma de comprar imóvel. Cadastre seu interesse e deixe os corretores encontrarem o imóvel ideal para você.',
  image: DEFAULT_IMAGE,
  url: BASE_URL,
  type: 'website',
};

function setMeta(selector, value, attrName = 'content') {
  let el = document.querySelector(selector);
  if (!el) {
    const [attr, val] = selector.replace('meta[', '').replace(']', '').split('=');
    el = document.createElement('meta');
    el.setAttribute(attr.trim(), val.replace(/"/g, '').trim());
    document.head.appendChild(el);
  }
  el.setAttribute(attrName, value || '');
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove();
}

/**
 * @param {object} opts
 * @param {string} opts.title       - Page title (without site suffix)
 * @param {string} opts.description
 * @param {string} [opts.image]     - Absolute URL of OG image
 * @param {string} [opts.path]      - Path, e.g. "/blog/meu-post"
 * @param {'website'|'article'} [opts.type]
 * @param {object} [opts.article]   - Full post object for Article JSON-LD
 */
export function useSEO({ title, description, image, path, type = 'website', article = null }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | MatchImóvel` : DEFAULTS.title;
    const fullUrl   = path ? `${BASE_URL}${path}` : BASE_URL;
    const img       = image || DEFAULT_IMAGE;
    const desc      = description || DEFAULTS.description;

    document.title = fullTitle;

    // Basic
    setMeta('meta[name="description"]', desc);

    // Open Graph
    setMeta('meta[property="og:title"]',       fullTitle,    'content');
    setMeta('meta[property="og:description"]',  desc,         'content');
    setMeta('meta[property="og:image"]',        img,          'content');
    setMeta('meta[property="og:url"]',          fullUrl,      'content');
    setMeta('meta[property="og:type"]',         type,         'content');

    // Twitter
    setMeta('meta[name="twitter:title"]',       fullTitle);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[name="twitter:image"]',       img);
    setMeta('meta[name="twitter:url"]',         fullUrl);

    // Canonical
    setLink('canonical', fullUrl);

    // Article JSON-LD
    if (article) {
      upsertJsonLd('seo-article-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.excerpt || desc,
        image: img,
        author: { '@type': 'Person', name: article.author_name || 'MatchImóvel' },
        publisher: {
          '@type': 'Organization',
          name: 'MatchImóvel',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo192.png` },
        },
        datePublished:    article.published_at,
        dateModified:     article.updated_at || article.published_at,
        mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
        url: fullUrl,
        keywords: (article.tags || []).join(', '),
      });
    }

    return () => {
      document.title = DEFAULTS.title;
      setMeta('meta[name="description"]',         DEFAULTS.description);
      setMeta('meta[property="og:title"]',        DEFAULTS.title,       'content');
      setMeta('meta[property="og:description"]',  DEFAULTS.description, 'content');
      setMeta('meta[property="og:image"]',        DEFAULTS.image,       'content');
      setMeta('meta[property="og:url"]',          DEFAULTS.url,         'content');
      setMeta('meta[property="og:type"]',         'website',            'content');
      setMeta('meta[name="twitter:title"]',       DEFAULTS.title);
      setMeta('meta[name="twitter:description"]', DEFAULTS.description);
      setMeta('meta[name="twitter:image"]',       DEFAULTS.image);
      setMeta('meta[name="twitter:url"]',         DEFAULTS.url);
      setLink('canonical',                        DEFAULTS.url);
      if (article) removeJsonLd('seo-article-jsonld');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, path, type, article?.id]);
}
