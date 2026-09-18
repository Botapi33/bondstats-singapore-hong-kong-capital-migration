BondStats SG–HK Capital Migration — DATA ENGINE FIX v2

Target:
Public repo: bondstats-singapore-hong-kong-capital-migration

Replace ONLY:
src/update.mjs

Do NOT replace:
.github/workflows/update.yml
package.json
package-lock.json
.nojekyll
output/latest.json
any bondstats-site file

Fixes:
1. Blank/null HKMA API values are no longer converted to numeric zero.
   This removes artificial -100% readings caused by missing observations.
2. Singapore period keys such as 2026Jul are normalized to 2026-07 so
   they match HKMA periods and historical evidence can populate.
3. Banking comparison uses official total banking assets on both sides.
4. Cross-border comparison uses Singapore non-resident loans versus
   HKMA external claims/liabilities as transparent international-exposure proxies.
5. 3m and 12m persistence checks are calculated separately.
6. Missing observations remain unavailable; no fabricated replacement values.
7. HKMA request uses pagesize=1000 to retrieve sufficient history.

After upload:
Actions -> Update Singapore Hong Kong Capital Migration -> Run workflow

Then inspect output/latest.json. Expected:
- no artificial -100 caused by blanks
- coverage should be > 0 when both official sources respond normally
- history should contain observations because month formats now align

The engine deliberately does NOT claim that a specific dollar moved directly
from Hong Kong to Singapore. It measures relative momentum in comparable
official banking/international-exposure indicators.
