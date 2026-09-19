# VibeCheck

**Is your app vibecoded?**

Paste a GitHub repo URL. Get an honest report on what makes your app look
like a prototype instead of a finished product.

**Live:** https://vibecheck-xxx.vercel.app _(replace with your URL)_

---

## What it does

VibeCheck scans public GitHub repositories and flags the small things that
quietly tell people your app isn't finished yet. No AI. No database. No
storage. Just static analysis and an honest report.

It looks for:

- **Legal & Trust** — privacy policy, terms of service, cookie consent, license, contact page
- **SEO & Meta** — page title, description, Open Graph image, favicon, robots.txt, sitemap
- **Errors & Edge States** — 404 page, error boundary, loading states, empty states
- **Code Hygiene** — `.env.example`, `.gitignore`, committed secrets, README, TODO comments
- **Vibecoded Signatures** — placeholder copy, default fonts, purple gradients, hardcoded localhost URLs, emoji-as-icons

Each issue comes with a plain-English explanation and a "copy fix prompt"
button — paste it into Cursor, Claude, or ChatGPT, and let it do the work.

There's also a single "Copy full report for AI" button that packages every
issue into a structured prompt, ready for your AI of choice.

---

## Why

I built VibeCheck because I kept seeing the same thing: people shipping AI-built
apps that technically work but look unfinished. Missing privacy pages.
Placeholder text still visible. Default Vite titles. No 404 page.

None of these things are hard to fix. But nobody tells you they matter until
someone bounces off your app without signing up.

VibeCheck is the tool I wish existed when I was shipping my first AI-built
project.

---

## How it works

```
User pastes repo URL
        ↓
POST /api/scan
        ↓
1. Parse owner/repo from the URL
2. Fetch the file tree via GitHub's API
3. Download a subset of source files
4. Run static checks (regex + file presence + AST-lite)
5. Score and categorize issues
        ↓
Render the report — score, verdict, grouped issues, copy buttons
```

Nothing is persisted. The repo is fetched, analyzed, and forgotten.

---

## Stack

- **Next.js 15** (App Router, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **GitHub REST API** (public, no scopes needed)
- **Vercel** for hosting

Zero external services. Zero database. Zero AI API costs.

---

## Local setup

```bash
# Clone
git clone https://github.com/himanshu-here-code/vibecheck.git
cd vibecheck

# Install
npm install

# Configure
cp .env.example .env.local
# Then open .env.local and add your GitHub token

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Getting a GitHub token

You need a token to raise the API rate limit from 60 requests/hour
(unauthenticated) to 5,000 requests/hour. It's free.

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Name: `vibecheck-local`
4. Expiration: 90 days (or whatever you prefer)
5. **Leave every scope unchecked** — public repos only need an empty token
6. Click **Generate token** and copy the `ghp_...` value
7. Paste it into `.env.local` as `GITHUB_TOKEN=ghp_...`

Never commit `.env.local`. It's already in `.gitignore`.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Yes | Classic GitHub PAT with zero scopes. Used for public repo access only. |

---

## Project structure

```
vibecheck/
├── app/
│   ├── api/scan/route.ts       # The scanner endpoint
│   ├── privacy/page.tsx        # Privacy policy
│   ├── terms/page.tsx          # Terms of service
│   ├── not-found.tsx           # Custom 404
│   ├── error.tsx               # Error boundary
│   ├── icon.png                # Favicon
│   ├── layout.tsx              # Root layout + fonts
│   ├── page.tsx                # The one-page app
│   └── globals.css             # Design tokens + utilities
├── components/
│   ├── CategorySection.tsx     # Collapsible report section
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Icons.tsx               # All inline SVG icons
│   ├── IssueCard.tsx           # Individual issue with copy button
│   ├── LoadingScan.tsx         # The rotating scan loader
│   ├── ProfileCard.tsx         # Report header with avatar + copy-all
│   ├── ScanInput.tsx           # The URL input + scan button
│   ├── ScoreRing.tsx           # Animated score ring
│   └── StatGrid.tsx            # Issues / Passed / Files counters
├── lib/
│   ├── github.ts               # GitHub API helpers
│   ├── types.ts                # Shared TypeScript types
│   └── checks/
│       ├── index.ts            # Runs all checks, computes score
│       ├── legal.ts            # Privacy, terms, cookies, license
│       ├── seo.ts              # Meta tags, favicon, OG image
│       ├── errors.ts           # 404, error boundary, loading
│       ├── hygiene.ts          # .env, .gitignore, README, secrets
│       └── signatures.ts       # Vibecoded fingerprint patterns
├── public/
│   └── icon.png                # Header icon (thinner version)
├── LICENSE
├── README.md
└── SECURITY.md
```

---

## Adding a new check

Each check lives in `lib/checks/`. Every check exports a function that
returns `{ issues: Issue[], passed: string[] }`.

1. Create a new file: `lib/checks/your-check.ts`
2. Export an async function that takes `RepoContext` and returns the shape above
3. Import it in `lib/checks/index.ts` and add it to the `Promise.all` array
4. Severity weights live at the top of `index.ts` — tune as needed

The `RepoContext` object gives you:

- `files` — every file path in the repo
- `fileSet` — a Set for fast lookups
- `getFile(path)` — fetch a file's content (cached)
- `getFileByPattern(regex)` — find the first matching file

Nothing else. Keep checks stateless.

---

## Deploying

The fastest path is Vercel:

```bash
npm install -g vercel
vercel
```

Then in the Vercel dashboard:

1. Go to **Settings → Environment Variables**
2. Add `GITHUB_TOKEN` for Production, Preview, and Development
3. Redeploy

You'll get a URL like `vibecheck-yourname.vercel.app`. Update the **Live**
link at the top of this README.

---

## Contributing

Issues and PRs welcome. A few guidelines:

- **Small PRs.** One check per PR, one bug fix per PR. Makes review sane.
- **Test your check.** Run it against 5-10 real repos before submitting.
- **Avoid false positives.** A check that flags something that isn't a problem
  is worse than no check at all. Add an exception rather than a shaky match.
- **Match the voice.** The UI copy is direct and human. New issues should
  sound like a friend telling you what's wrong, not a linter barking at you.

---

## License

[AGPL-3.0](LICENSE) — free to use, self-host, and modify. If you run it as a
public service, you must publish your changes.

For commercial use without the AGPL obligation, reach out:
[github.com/himanshu-here-code](https://github.com/himanshu-here-code)

---

## Credits

Built by [Himanshu](https://github.com/himanshu-here-code) because vibecoded
apps deserve a chance to grow up.