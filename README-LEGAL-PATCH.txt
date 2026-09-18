BONDSTATS SG-HK LEGAL / ATTRIBUTION PATCH

CHANGES EXACTLY ONE EXISTING FILE:
src/pages/markets/singapore-hong-kong-capital-migration/index.astro

No navigation, layout, RSS, sitemap, engine, country page, book page, legacy page,
or other BondStats file is included or changed.

Changes:
- removes the BIS source card from this tool
- keeps only the two sources actually used by the current calculation
- adds Singapore Open Data Licence attribution/link
- adds HKMA Terms attribution/link
- adds explicit BondStats independence / non-endorsement wording
- states that BondStats calculations, classifications, visualisations and methodology are independent
- states that source data/APIs remain subject to their own terms/licences/disclaimers
- changes the source-card grid from 3 columns to 2 columns

Safety:
The patch was generated only after finding the exact current evidence/source block.
If that exact block had not matched, generation would have aborted instead of making a broad replacement.
