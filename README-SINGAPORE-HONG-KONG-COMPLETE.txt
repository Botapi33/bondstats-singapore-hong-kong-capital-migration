BondStats Singapore–Hong Kong Capital Migration Tracker — COMPLETE PATCH
Baseline: bondstats-site-main-4.zip

Adds a complete public tool, automatic official-data engine, daily GitHub Actions refresh, JSON data endpoint, sitemap and one Research Databases navigation entry.

Official automatic inputs:
- Singapore Department of Statistics / MAS commercial-bank balance sheet dataset d_f357c61441e2850ca4eae05813ebd37b
- HKMA Open API banking-statistics endpoint
- BIS Locational Banking Statistics is exposed as the methodological cross-check/source link. The engine does not fabricate BIS observations if a stable machine-readable series is unavailable.

Methodological guardrail: this is a relative evidence engine. It does NOT claim that an identified dollar moved directly from Hong Kong to Singapore. Directional output requires multi-channel agreement, persistence and sufficient coverage. Missing source observations remain unavailable.

Files added:
- src/pages/markets/singapore-hong-kong-capital-migration/index.astro
- src/pages/sitemap-singapore-hong-kong-capital-migration.xml.ts
- scripts/update-singapore-hong-kong-capital-migration.mjs
- .github/workflows/update-singapore-hong-kong-capital-migration.yml
- public/data/singapore-hong-kong-capital-migration/latest.json

Files minimally modified:
- src/pages/index.astro (one nav entry)
- src/pages/[...slug].astro (one nav entry)
- src/pages/robots.txt.ts (one sitemap line)

After merge/deploy: run the workflow once manually. It then refreshes daily at 06:17 UTC and commits only if generated data changes. A data commit should trigger the normal Cloudflare deployment if the repository is already connected to Cloudflare.

IMPORTANT: If main changed after bondstats-site-main-4.zip, rebase these additive changes against the newest main instead of blindly replacing the three modified existing files.
