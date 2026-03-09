import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LOCALE_MAP } from '../i18n/languages';
import type { SupportedLanguage } from '../i18n/languages';
import { CANONICAL_ORIGIN, BASE_PATH } from '../constants/app';

const JSONLD_SCRIPT_ID = 'structured-data';

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertMetaProperty(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertJsonLd(data: Record<string, unknown>) {
  let script = document.getElementById(JSONLD_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = JSONLD_SCRIPT_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function useDocumentMeta() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language as SupportedLanguage;
    const langUrl = (l: string) => `${CANONICAL_ORIGIN}${BASE_PATH}/${l}`;
    const currentUrl = langUrl(lang);
    const title = t('meta.title');
    const description = t('meta.description');

    document.title = title;
    document.documentElement.lang = lang;
    upsertMeta('description', description);
    upsertMeta('keywords', t('meta.keywords'));
    upsertLink('canonical', currentUrl);

    for (const { code } of SUPPORTED_LANGUAGES) {
      upsertLink('alternate', langUrl(code), code);
    }
    upsertLink('alternate', langUrl('en'), 'x-default');

    // Open Graph
    upsertMetaProperty('og:title', title);
    upsertMetaProperty('og:description', description);
    upsertMetaProperty('og:url', currentUrl);
    upsertMetaProperty('og:locale', LOCALE_MAP[lang]);
    upsertMetaProperty('og:type', 'website');
    upsertMetaProperty('og:site_name', 'Interest-Calculator');

    const alternateLangs = SUPPORTED_LANGUAGES.filter(({ code }) => code !== lang);
    for (const { code } of alternateLangs) {
      upsertMetaProperty('og:locale:alternate', LOCALE_MAP[code]);
    }

    // Twitter Card
    upsertMeta('twitter:card', 'summary');
    upsertMeta('twitter:title', title);
    upsertMeta('twitter:description', description);

    // JSON-LD Structured Data
    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      description,
      url: currentUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      inLanguage: SUPPORTED_LANGUAGES.map(({ code }) => code),
      author: {
        '@type': 'Person',
        name: 'nsmeele',
        url: 'https://github.com/nsmeele',
      },
    });
  }, [t, i18n.language]);
}
