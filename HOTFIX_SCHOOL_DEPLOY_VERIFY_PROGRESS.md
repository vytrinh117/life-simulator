# SCHOOL UI — Deployment / Cache Verification Follow-up

**Status:** Cache-busting release prepared; **live hosted fix unconfirmed without the player's deployed URL**.

## What was checked
- Reviewed `life-sim-HOTFIX-school-ui-integration-complete.zip` and authoritative `src/` modules.
- DOM handlers for Go to School, Go Home, Teacher and School Facilities are present and mapped to the current `data-*` attributes.
- Rebuilt from `src/` twice against the supplied baseline: `game.js` and `style.css` exactly matched original release hashes, indicating that the delivered archive contains the documented source changes.
- Existing DOM-click QA uses fresh ephemeral browser pages, not a real GitHub Pages session, so passing QA does **not** establish that a remote browser loaded the newest JS.
- Original `index.html` loaded unversioned `game.js`, `style.css` and `data.js`. This permits stale browser/CDN assets to remain a plausible cause of seeing the former School UI.

## Changes (deployment-only)
- Updated only `index.html` to add content-hash query strings to `game.js`, `style.css`, and `data.js`.
- Added `<meta name="life-sim-build" content="school-ui-verified-31320ef6c687">` for simple hosted page verification.
- No gameplay source functions or `src/modules` changed. Phase 5C remains COMPLETE, Phase 6 NOT STARTED.

## Verifying a GitHub Pages deployment
1. Unzip **the release package**, open its single `life-sim-HOTFIX-school-ui-cache-verification` folder and upload **the files inside it** to the **repository root**, keeping `index.html`, `data.js`, `game.js` and `style.css` next to one another. Do not upload the ZIP by itself or nest the folder in the repository.
2. Commit and push changes to `main`. In GitHub Actions, confirm the **Deploy Life Sim to GitHub Pages** workflow succeeded. Pages settings must use **GitHub Actions** as the source.
3. Open the published game's URL in a private/incognito tab, or use a forced reload (Ctrl+Shift+R on Windows). Existing life saves are in browser storage; using incognito will use a new save, so export the current life first if needed.
4. In browser Developer Tools → Console, run:

```js
document.querySelector('meta[name="life-sim-build"]')?.content
```
Expected: `school-ui-verified-31320ef6c687`. If undefined/different, the browser is not loading the new `index.html`.
5. Verify script URL:

```js
document.querySelector('script[src*="game.js"]')?.src
```
Expected: ends in `game.js?v=31320ef6c687`. If different, deployment/caching is still stale.
6. Test School with a school-age character on a school day, within a legal action window. If buttons still do nothing despite these correct identifiers, capture the exact published URL, button label, game clock/location, and any Console messages. Those observations are needed to identify an additional **live-only** defect.

**Limit:** Versioning avoids caching stale JS **once the new `index.html` is actually deployed**, but it does not itself fix a broken remote deployment, wrong repo root, old browser tab, or a gameplay gate. No live site was accessible for direct testing in this session.

## Final local verification

- Browser actual DOM clicks: `qa/t_hotfix_school_nav.py` **17/17 PASS**, `qa/t_hotfix_school_ui_integration.py` **58/58 PASS**.
- Phase 5C release audit: `qa/t_5c55_release.py` **24/24 PASS** (QA loader updated to support versioned static asset URLs, without changing tested game semantics).
- Phase 4C: `qa/t_4c1.py` **20/20**, `t_4c2.py` **21/21**, `t_4c3.py` **20/20**, `t_4c4.py` **22/22**, `t_4c5_accept.py` **28/28**.
- New asset integrity suite `qa/t_hotfix_school_deploy_verify.py`: **6/6 PASS**, including equality of HTML query hashes and generated assets.
- **216/216 PASS across nine verified suites**. The previous browser suites do not simulate live GitHub hosting; this remains an explicit limitation.
- Generated scripts/CSS remain unchanged and byte-identical to the preceding hotfix; only HTML references, QA asset-loader compatibility and release documentation changed. `node --check` passed for production `game.js` and `data.js`.
- The previously confirmed UI source patch did not need another code change to pass local tests; remote stale assets/deployment are still a hypothesis, not a demonstrated cause.
