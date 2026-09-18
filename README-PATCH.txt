BondStats Singapore-Hong Kong Capital Migration — Public Engine Patch

Upload these files/folders to the ROOT of the public repository.
This patch intentionally does NOT contain or replace .github/workflows/update.yml.
Keep the currently working workflow already present in the repository.

Adds:
- package.json
- package-lock.json
- src/update.mjs
- output/latest.json

After upload, run Actions -> Update Singapore Hong Kong Capital Migration -> Run workflow.
The workflow should detect npm run update and execute src/update.mjs.
