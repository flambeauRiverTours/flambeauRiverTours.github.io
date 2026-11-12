# Plan: move the site from GitHub Pages to Azure Static Web Apps

**Why:** GitHub Pages hasn't issued a certificate covering `www` since 26 Oct. The apex certificate expires on 26 Dec and renews through the same stuck process. The `ff` subdomain already runs on Static Web Apps without trouble. **Deadline:** the apex is cut over by 1 Dec.

**Cost: $0 a month.**
- **Static Web Apps Free:** $0, certificates included. 100 GB of bandwidth a month per subscription, shared with `ff` (which used 0.035 GB in 30 days). No overage: if the limit is hit, both apps stop until the next month. 2 custom domains per app.
- **DNS:** stays at GoDaddy, included with the registration.
- **Bandwidth alerts:** free, within the 10 free alert time series.
- **The only things that could bill:** moving to Standard ($9 a month, plus $0.20 per GB of overage) or the enterprise edge (about $17.50 a month). The $15 budget on `budget-jtassistant` would warn on either.

**Design:**
- **DNS (option C):**
  - `www` is a CNAME to the app.
  - The apex has a TXT record proving ownership and an A record to the app's `stableInboundIP`.
  - GitHub's AAAA records are deleted.
- **Default domain:** the apex. Static Web Apps serves it from one regional host, and the app redirects `www` to it.
- **Project sites:** `/FantasyFootballWebsite*` and `/dailyDriver*` get 301 redirects to `flambeaurivertours.github.io/<repo>/`.
- **`ff.jacktreadwell.com`:** untouched. It's a separate app, resource group, CNAME record and token. Check it before and after each DNS step.

## PR 1: infra
1. `infra/site.bicep`, deployed on its own by `api.yml`, not as a module of `main.bicep`:
   - `stapp-jtsite`, `Microsoft.Web/staticSites@2025-03-01` (the newest the local Bicep has types for), `eastus2`, no repo link.
   - The SKU is a parameter that defaults to `Free`.
   - Outputs: the default hostname, and `stableInboundIP` (with `BCP053` disabled on that line).
   - Custom domains are added by CLI, not in Bicep.
   - The deploy identity's Contributor role is enough.
2. `api.yml` previews and deploys `site.bicep`.
3. actionlint moves from `api.yml` to `ci.yml`, so every pull request lints every workflow. Adding `.github/workflows/**` to `api.yml`'s paths would have redeployed the API on every workflow change.
4. Tests in `scripts/workflow-paths.test.ts` check that `api.yml` deploys `site.bicep`, that it previews every template it deploys, and that `ci.yml` runs actionlint.

## PR 2: deploy (after PR 1 merges, so the app exists)
5. **`public/staticwebapp.config.json`:**
   - the redirects;
   - no `navigationFallback`, so missing pages return a real 404;
   - `nosniff` and `Referrer-Policy` headers;
   - `/assets/*` cached as immutable.
6. **A `swa` job in `deploy.yml`:**
   - `needs: check`, and **no `environment:`**: the OIDC credentials only trust `main` and `pull_request`.
   - It gets the token with `az staticwebapp secrets list` and masks it.
   - The deploy action is pinned by SHA, with `skip_app_build`, `app_location: dist` and `action: upload`.
   - The Pages job keeps running alongside it.
   - The concurrency group is `site-deploy`, never cancelled midway.
7. **`scripts/site-smoke.sh`**, run against a host passed to it, checks:
   - the redirects;
   - a missing page returns 404;
   - the static files return 200;
   - the page is this build's.

## Cutover
8. **[you]** Lower the GoDaddy TTLs to 600 seconds a day ahead.
9. **`www`:**
   - **[asks first]** Add the domain with TXT validation.
   - Prove the certificate with `curl --resolve www.jacktreadwell.com:443:<ip>`.
   - **[you]** Point the CNAME at the app.
10. **Apex:**
   - **[asks first]** Add the domain with TXT validation, and keep that TXT record afterwards.
   - Prove the certificate the same way.
   - **[you]** Replace the A records and delete the AAAA records.
   - **[asks first]** Straight away, remove the Pages custom domain, which would otherwise cause a redirect loop. Then set the apex as the default domain.
   - **Rollback:** restore GitHub's A and AAAA records and the `www` CNAME. This restarts the stuck GitHub certificate request.

## PR 3: retire Pages (after a few clean days)
11. **[asks first]** Turn Pages off for this repo.
12. Remove the Pages job and the `CNAME` file.
13. Point the "Write-up" link at `github.io`, then run `npm run build:knowledge`.
14. Keep the `_github-pages-challenge` TXT record.
15. Add a `BytesSent` alert at 3 GB a day, a weekly check that certificates have more than 21 days left, and a short README note.

## Considered, not doing
- **Azure DNS with an apex ALIAS record:** $0.50 a month, and it would mean moving every record, `ff` included.
- **GoDaddy forwarding from the apex:** HTTPS on the forwarded apex is unverified.
- **`www` as the default domain:** the apex is kept as the default for existing links.
- **The Standard plan:** $9 a month. Moving to it is one setting if the Free limits ever bite.
- **Project-site subdomains, a content security policy, SWA managed Functions, moving the registrar, a `navigationFallback`:** none of these are needed.
- **A stored deployment token secret:** the token is fetched at run time instead.
- **Custom domains in Bicep:** apex TXT validation needs a token generated after the app is created.
- **A Vitest test that reads back the config:** it's a tautology, so the smoke script tests the config instead.
- **A `CanNotDelete` lock on the app:** optional for you; the Contributor role can't create locks.
