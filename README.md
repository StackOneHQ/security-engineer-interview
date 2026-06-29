# Acme Integrations Gateway — Security Exercise

> ⚠️ **This app is intentionally insecure.** It was built for a StackOne hiring exercise and contains deliberate vulnerabilities. Do not deploy it, do not reuse its code, and do not point it at anything you care about.

Welcome, and thanks for taking the time. This is a small, self-contained service that stands in for the kind of system you'd work on at StackOne: an integration gateway that links third-party accounts, stores their credentials, and proxies calls to those connectors on a tenant's behalf.

You don't need to know StackOne's real product to do well here. Everything you need is in this repo.

## What you'll do

This is a live, ~60 minute session in three parts.

**Part A: find what's wrong (~25 min).** Get the app running, explore the code, and find as many real problems as you can. Tell us what you found, how you'd exploit it, and how serious it is. Use whatever tools you normally reach for: Claude, Copilot, Burp, curl, scanners, all fair game. You won't necessarily find everything in the time, and that's fine. We care about your reasoning and the depth of what you find, not a raw count.

**Part B: triage a report (~10 min).** We'll hand you a short findings report and talk through it: what would you fix first, and why. Not everything in the report is necessarily a real, exploitable issue, so part of the job is telling which are which.

**Part C: fix one (~20 min).** You'll pick the highest-priority issue and implement a fix in the code, live, then show it works. We're interested in how you reason about a root-cause fix, not in perfect finished code.

There's nothing to submit in advance. Come on a machine where you can edit and run the code and share your screen.

## Run it

You need Node 20+ (or Docker).

```bash
npm install
npm run seed     # creates the database and two demo tenants
npm run dev      # starts the gateway on http://localhost:4000
```

Or with Docker:

```bash
docker compose up --build
```

Check it's alive:

```bash
curl http://localhost:4000/health
```

## The two tenants

The seed script prints two tenant API keys. Each tenant has linked a couple of connector accounts:

- **Initech** — `sk_live_initech_a1b2c3d4e5f6`
- **Hooli** — `sk_live_hooli_9z8y7x6w5v4u`

Authenticate by sending the key as a bearer token:

```bash
curl -H "Authorization: Bearer sk_live_initech_a1b2c3d4e5f6" \
  http://localhost:4000/accounts
```

## What the gateway does

| Area | Endpoint | Purpose |
|------|----------|---------|
| Accounts | `GET /accounts`, `GET /accounts/:id`, `PATCH /accounts/:id` | List, inspect, and update a tenant's linked connector accounts |
| Proxy | `POST /proxy/:accountId` | Call a connector's upstream API with the stored credentials |
| Operator | `GET /ops/export`, `GET /ops/diag` | Internal support surface (requires an operator session token, not a tenant API key) |

The source lives under `src/` and it's small enough to read end to end: `index.ts` has the routes, `repository.ts` the data access, `auth.ts` the authentication, and `db.ts` the schema. You're given two tenant API keys; the operator surface expects something else. The production database is defined as Terraform under `infra/`.

## Ground rules

- AI assistants and any other tooling are welcome and expected.
- If something about the setup is unclear or broken, just ask; that's not part of the test.
- Asking us clarifying questions during the session is encouraged, not penalized.

Good luck.
