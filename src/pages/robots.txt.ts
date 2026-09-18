export const prerender = true;

export function GET() {
  const body = `# BondStats — maximum public discovery policy
# Public content is intentionally open to search, AI search/retrieval, research and archive crawlers.
# The wildcard rule also allows crawlers not explicitly named below.

User-agent: *
Allow: /

# Google Search / discovery
User-agent: Googlebot
Allow: /
User-agent: Googlebot-Image
Allow: /
User-agent: Googlebot-Video
Allow: /
User-agent: Googlebot-News
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Storebot-Google
Allow: /
User-agent: AdsBot-Google
Allow: /
User-agent: AdsBot-Google-Mobile
Allow: /

# Microsoft / Bing
User-agent: Bingbot
Allow: /
User-agent: BingPreview
Allow: /
User-agent: MicrosoftPreview
Allow: /

# OpenAI
User-agent: OAI-SearchBot
Allow: /
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: OAI-AdsBot
Allow: /

# Anthropic
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /

# Perplexity
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /

# Apple
User-agent: Applebot
Allow: /
User-agent: Applebot-Extended
Allow: /

# DuckDuckGo / AI retrieval
User-agent: DuckDuckBot
Allow: /
User-agent: DuckAssistBot
Allow: /

# Common Crawl / AI ecosystem
User-agent: CCBot
Allow: /
User-agent: Bytespider
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: Meta-ExternalAgent
Allow: /
User-agent: Meta-ExternalFetcher
Allow: /
User-agent: cohere-ai
Allow: /

# Other major search/discovery crawlers
User-agent: YandexBot
Allow: /
User-agent: YandexImages
Allow: /
User-agent: Baiduspider
Allow: /
User-agent: Baiduspider-image
Allow: /
User-agent: Slurp
Allow: /
User-agent: Yeti
Allow: /
User-agent: NaverBot
Allow: /
User-agent: PetalBot
Allow: /
User-agent: SeznamBot
Allow: /
User-agent: Qwantbot
Allow: /
User-agent: MojeekBot
Allow: /
User-agent: Bravebot
Allow: /

# Research / link discovery / archives
User-agent: ia_archiver
Allow: /
User-agent: archive.org_bot
Allow: /
User-agent: AhrefsBot
Allow: /
User-agent: SemrushBot
Allow: /
User-agent: MJ12bot
Allow: /
User-agent: DotBot
Allow: /

Sitemap: https://www.bondstats.org/sitemap-production.xml
Sitemap: https://www.bondstats.org/sitemap.xml\nSitemap: https://www.bondstats.org/sitemap-glossary.xml\nSitemap: https://www.bondstats.org/sitemap-bond-questions.xml\nSitemap: https://www.bondstats.org/sitemap-security-glossary.xml\nSitemap: https://www.bondstats.org/sitemap-security-tools.xml\nSitemap: https://www.bondstats.org/sitemap-central-bank-tools.xml
Sitemap: https://www.bondstats.org/sitemap-financial-formulas.xml
Sitemap: https://www.bondstats.org/sitemap-financial-acronyms.xml
Sitemap: https://www.bondstats.org/sitemap-market-conventions.xml
Sitemap: https://www.bondstats.org/sitemap-financial-plumbing.xml\nSitemap: https://www.bondstats.org/sitemap-china-financial-machine.xml\nSitemap: https://www.bondstats.org/sitemap-china-financial-system.xml
Sitemap: https://www.bondstats.org/sitemap-financial-iceberg.xml

Sitemap: https://www.bondstats.org/sitemap-market-signals.xml

Sitemap: https://www.bondstats.org/sitemap-financial-indicators.xml

Sitemap: https://www.bondstats.org/sitemap-bond-market-patterns.xml

Sitemap: https://www.bondstats.org/sitemap-economic-indicators.xml

Sitemap: https://www.bondstats.org/sitemap-central-bank-indicators.xml

Sitemap: https://www.bondstats.org/sitemap-financial-risk-indicators.xml

Sitemap: https://www.bondstats.org/sitemap-fixed-income-strategies.xml

Sitemap: https://www.bondstats.org/sitemap-market-anomalies.xml
\nSitemap: https://www.bondstats.org/sitemap-china-liquidity.xml
Sitemap: https://www.bondstats.org/sitemap-market-microstructure.xml
Sitemap: https://www.bondstats.org/sitemap-credit-markets.xml
Sitemap: https://www.bondstats.org/sitemap-derivatives-hedging.xml
Sitemap: https://www.bondstats.org/sitemap-structured-finance.xml
Sitemap: https://www.bondstats.org/sitemap-money-markets.xml
Sitemap: https://www.bondstats.org/sitemap-sovereign-debt.xml
Sitemap: https://www.bondstats.org/sitemap-bank-balance-sheet.xml
Sitemap: https://www.bondstats.org/sitemap-digital-asset-market-structure.xml\nSitemap: https://www.bondstats.org/sitemap-financial-market-data.xml
Sitemap: https://www.bondstats.org/sitemap-china-credit-cycle.xml
Sitemap: https://www.bondstats.org/sitemap-singapore-hong-kong-capital-migration.xml`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

