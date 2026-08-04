# Frontend Guide

## Application Areas
- `/` production SaaS landing page.
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/change-password` authentication screens.
- `/dashboard` merchant portal.
- `/search` fraud search workspace.
- `/billing` billing workspace.
- `/admin` and child routes for operational management.

## API Integration
- Frontend requests use `frontend/lib/api.ts`.
- API envelopes are parsed consistently.
- Secure-cookie compatible requests use `credentials: "include"`.
- Mock/demo datasets have been removed from active UI imports.

## UX Rules
- Empty states are shown when live APIs return no records.
- Errors are displayed without replacing them with fake data.
- SEO metadata, robots, sitemap, manifest, 404, and global error boundaries are present.
