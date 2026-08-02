# Deal or No Deal

A browser recreation of the classic Deal or No Deal game show, built with plain HTML, CSS, and JavaScript (no build step, no dependencies).

## How to play

1. Pick one of the 26 briefcases as your own — it stays sealed until the end.
2. Each round, open the requested number of the remaining cases to reveal their dollar amounts and eliminate them from play.
3. After each round, the banker calls with an offer based on the value of the cases still in play. Choose **Deal** to bank that amount and end the game, or **No Deal** to keep going.
4. When only one other case remains, make your final call: keep your original case or swap it for the last one on the board.

## Running locally

This is a static site, so any static file server works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` builds and deploys the site automatically on every push to `main`.

To finish enabling it (one-time setup):

1. Go to the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (or re-run the workflow) — the site will be published at `https://<owner>.github.io/<repo>/`.
