# PowerSchool Support Portal

An internal chat-style support tool for the district's 5 PowerScool (PowerSchool)
admins: pick a category, describe the issue, get an instant Claude-generated
answer with PowerSchool click-paths and a related training video, then either
close it out or escalate straight to the PowerSchool lead.

## How it works

1. **Landing screen** — admin picks a category (Admissions, Dropouts,
   Behavior, Attendance, Grades, Enrollment, Scheduling, Reports, Other).
2. **Question box** — free-text "Describe your question or issue" (category
   stays in context).
3. **Claude answers** — the category + question are sent to Claude
   (`claude-sonnet-5`) with a system prompt that roleplays a PowerSchool SIS
   support expert, answers in numbered click-by-click steps, and explicitly
   says when something is too district-specific for it to know.
4. **Video card** — if the category/keywords match an entry in
   `src/config/videoMapping.ts`, a "📹 Related tutorial video" card is shown
   under the answer (falls back to the full SharePoint training folder).
5. **Was this helpful?**
   - **Yes** → case is logged as resolved and a summary email goes to the
     support lead.
   - **No** → a short "Connect with a support engineer" form appears;
     submitting it emails the support lead with an ESCALATION NEEDED subject
     and shows the admin a confirmation.
6. **`/admin/cases`** — all 5 admins can view case history here, filterable
   by category and helpful/not-helpful, to spot recurring pain points.

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS** — one deployable app.
- **SQLite via Prisma** — stores cases (category, question, answer, helpful
  flag, admin identity, timestamps). See `prisma/schema.prisma`.
- **`@anthropic-ai/sdk`** — calls Claude (`claude-sonnet-5`), reads
  `ANTHROPIC_API_KEY`.
- **Nodemailer (SMTP)** — sends case summary/escalation emails.

## Files you'll actually want to edit

These are kept separate from app logic so you don't need to touch any React
code to update them:

| File | What it's for |
| --- | --- |
| `src/config/categories.ts` | The category list on the landing screen. |
| `src/config/videoMapping.ts` | Category/keyword → SharePoint video links. |
| `.env` (`ADMIN_LIST`) | The 5 admins' names + emails allowed to log in. |

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite file path, e.g. `file:./dev.db`. |
| `ANTHROPIC_API_KEY` | Yes | From console.anthropic.com. Without it, Claude calls fail gracefully (see "Error handling" below). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Yes, for email | SMTP creds for sending case emails. |
| `SUPPORT_LEAD_EMAIL` | No | Defaults to `yousif.jawad@alsamaproject.com`. |
| `ADMIN_LIST` | Yes | JSON array: `[{"name":"...","email":"..."}, ...]` — the 5 admins. |
| `APP_PASSCODE` | No | If set, login also requires this shared passcode. Leave blank to skip. |
| `SESSION_SECRET` | Recommended | Random string used to sign the login cookie (`openssl rand -hex 32`). |

### A note on Microsoft 365 + SMTP

If the sending mailbox is on Microsoft 365, **SMTP AUTH is disabled by
default** for most tenants/mailboxes. Emails will fail until an admin either:

- Enables Authenticated SMTP for that specific mailbox
  (Exchange admin center → Recipients → mailbox → "Manage email apps" →
  turn on "Authenticated SMTP"), or
- Enables it tenant-wide via PowerShell
  (`Set-CASMailbox -Identity <mailbox> -SmtpClientAuthenticationDisabled $false`).

If your tenant blocks SMTP AUTH entirely (Security Defaults / Conditional
Access), the longer-term fix is to swap `src/lib/mailer.ts` for Microsoft
Graph's `sendMail` API instead of SMTP — the rest of the app doesn't need to
change, since all email sending goes through that one file.

## Running locally

```bash
npm install
cp .env.example .env   # then fill in the values above
npm run db:push        # creates prisma/dev.db from the schema
npm run dev             # http://localhost:3000
```

`npm run db:push` (an alias for `prisma db push`) creates the SQLite file and
tables from `prisma/schema.prisma`. Re-run it any time you change the schema.

To browse the case data directly: `npm run db:studio`.

## Deploying

### Vercel

- Works out of the box for the Next.js app itself, **but Vercel's filesystem
  is ephemeral** — a SQLite file written at runtime does not persist across
  deploys/instances. Either:
  - Use [Vercel-hosted Postgres](https://vercel.com/storage/postgres) (or
    Turso/LibSQL, Neon, etc.) instead of local SQLite — just change
    `provider`/`url` in `prisma/schema.prisma` and `DATABASE_URL`, no app
    code changes needed, or
  - Deploy to a host with a persistent disk (see below) if you want to keep
    plain SQLite.
- Set all env vars from the table above in the Vercel project settings.
- Build command stays `npm run build` (already runs `prisma generate`
  first); add a one-time `prisma db push` (via a Vercel "Deploy Hook" or
  running it locally against the production `DATABASE_URL`) to create the
  schema.

### Simple Node host (e.g. a small VM, Railway, Render, Fly.io)

- These typically offer a persistent disk, so plain SQLite works fine —
  point `DATABASE_URL` at a file path on that disk.
- Build: `npm install && npm run build`. Start: `npm run start`.
- Run `npm run db:push` once after first deploy (and after any schema
  change) to create/update the SQLite tables.
- Make sure the process has outbound HTTPS access for the Anthropic API and
  your SMTP provider.

## Error handling

- If the Anthropic API call fails (bad key, rate limit, network), the admin
  still sees a friendly message and can go straight to "Connect with a
  support engineer" — the case is still logged (with the error saved for
  troubleshooting in `/admin/cases`).
- If sending an email fails (SMTP not configured, auth rejected, etc.), the
  admin still gets their normal confirmation — the failure is only surfaced
  as a small note ("we couldn't email your lead automatically"), and the
  case is always saved to the database either way, so nothing is lost.

## Access / login

There's no full auth system — just a lightweight gate matching the "5
known admins" scope:

- On `/login`, the admin picks their name from `ADMIN_LIST` (optionally plus
  a shared `APP_PASSCODE`, if you set one).
- A signed cookie remembers who they are for 30 days; it's used to attach an
  identity to each case and to the emails sent to the support lead.
- `/admin/cases` is visible to any signed-in admin (no separate admin role,
  per spec — all 5 admins can see case history).

## What's intentionally not here

Per spec, this app does not include: user sign-up/OAuth, multi-tenant
support, or roles beyond "the 5 admins." Keep it that way unless the scope
changes.
