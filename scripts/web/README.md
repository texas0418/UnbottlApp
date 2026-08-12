# Deploying unbottl.com

The live site is the Expo web export **plus three static files from this
directory** — the Apache config, the marketing landing page, and its logo.
The rsync uses `--delete`, so anything not staged into the deploy directory
is removed from the server. **Always copy all three.**

```
EXPO_PUBLIC_OPENAI_API_KEY= npx expo export --platform web --output-dir /tmp/webdeploy
cp scripts/web/htaccess /tmp/webdeploy/.htaccess
cp scripts/web/landing.html scripts/web/landing-logo.png /tmp/webdeploy/
rsync -az --delete --no-perms --no-times /tmp/webdeploy/ siteground-unbottl:www/unbottl.com/public_html/
```

- The empty `EXPO_PUBLIC_OPENAI_API_KEY` is **mandatory** — `EXPO_PUBLIC_*`
  vars are compiled into the client bundle, and the key must never ship.
- Host is `ssh siteground-unbottl` (a separate SiteGround account from
  simonbuilds.app). Doc root `~/www/unbottl.com/public_html`.
- SuperCacher holds the bare domain after a deploy; flush it manually in
  SiteGround Site Tools. The `/m/…` menu routes are unaffected.
- Routing: `DirectoryIndex` serves `landing.html` at `/`; every other
  non-file path rewrites to the SPA's `index.html` (see `htaccess`).
- `landing-logo.png` is `assets/images/icon.png` resized to 512px
  (`sips -Z 512`). Regenerate it if the app icon changes.
