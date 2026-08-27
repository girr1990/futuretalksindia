# FutureTalks India

Official website for FutureTalks India — what India, and normal people, can build with AI. Products fund the infrastructure. Education (cohort, YouTube, insights) teaches how the products were actually built and lives on the separate Academy site.

## What's here
- `index.html` — Main website, with a Buddy private-beta hero and an Academy teaser
- `frameworks.html` — The four LSS-AI frameworks, framed as how we build, not sold as enterprise consulting
- `work.html` — Product inventory: Buddy, STS Community Hub, One STS, content-system tools, React apps, and the tech stack
- `insights.html` — Writing on AI, reinvention, and method
- `contact.html` — Get in touch
- `admin-leads.html` — Internal dashboard for viewing and managing leads captured across the site (Supabase-backed, not linked from public nav)
- `privacy.html` — Privacy policy
- `photos/` — Founder photos
- `netlify/functions/` — Serverless backend (Nova chatbot, OTP verification, lead capture/subscribe, lead admin APIs)
- `netlify.toml` — Netlify configuration
- `docs/PROJECT_CONTEXT.md` — Steering doc every AI assistant should read first before editing this repo

## Nova
The site's AI assistant, powered by Claude (Anthropic) via `netlify/functions/nova.js`. Requires `ANTHROPIC_API_KEY` set in Netlify.

## Buddy
Fairness-based group expense splitting for trips: AI receipt scanning, budget planning, and a splitting engine that accounts for who actually drank, ate, and opted in. FutureTalks India's flagship proof product — concrete evidence of what a normal person can ship with AI. Live at buddy.futuretalksindia.com (also tripbuddyindia.netlify.app).

## Academy
All cohort and learning content management happens at academy.futuretalksindia.com, a separate site/repo. This repo links out to it from the nav and the homepage teaser section, but does not contain its code and no longer hosts any cohort landing page or registration flow of its own (the former `lssai-blackbelt.html` cohort page was retired and now 301-redirects to Academy — see `netlify.toml`).

## Data
Leads and subscribers are stored in Supabase (`ft_leads` table), written to via the Netlify functions above and reviewed through `admin-leads.html`. Historical cohort-application rows from the retired blackbelt page remain in that table but no new ones are created here.

## Live sites
- futuretalksindia.com
- buddy.futuretalksindia.com (Buddy app)
- academy.futuretalksindia.com (Academy, separate repo)

## Founder
RC — futuretalks.india@gmail.com
