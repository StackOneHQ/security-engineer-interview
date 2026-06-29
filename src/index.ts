import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import cors from "cors";
import { execSync } from "node:child_process";
import { config } from "./config.js";
import { initSchema } from "./db.js";
import { requireOperator, requireTenant } from "./auth.js";
import { accounts } from "./repository.js";

// Wrap async handlers so rejected promises reach the error middleware.
const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

// Provider hosts the gateway may forward connector traffic to.
const ALLOWED_HOSTS = ["bamboohr.example.com", "salesforce.example.com", "workday.example.com"];

// Diagnostic checks operators can run against the host.
const DIAGNOSTICS: Record<string, string> = {
  uptime: "uptime",
  disk: "df -h",
  node: "node --version",
};

initSchema();

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "acme-integrations-gateway" });
});

// --- Accounts (tenant-scoped) ----------------------------------------------

app.get(
  "/accounts",
  requireTenant,
  asyncHandler(async (req, res) => {
    const sort = req.query.sort ? String(req.query.sort) : undefined;
    res.json({ accounts: accounts.listForTenant(req.tenant!.id, sort) });
  }),
);

app.get(
  "/accounts/:id",
  requireTenant,
  asyncHandler(async (req, res) => {
    const account = accounts.findForTenant(req.params.id, req.tenant!.id);
    if (!account) {
      res.status(404).json({ error: "account not found" });
      return;
    }
    res.json({ account });
  }),
);

app.patch(
  "/accounts/:id",
  requireTenant,
  asyncHandler(async (req, res) => {
    const account = accounts.findById(req.params.id);
    if (!account) {
      res.status(404).json({ error: "account not found" });
      return;
    }
    const updated = accounts.update(account.id, (req.body ?? {}) as Record<string, unknown>);
    if (!updated) {
      res.status(400).json({ error: "no updatable fields provided" });
      return;
    }
    res.json({ account: updated });
  }),
);

// --- Connector proxy --------------------------------------------------------

app.post(
  "/proxy/:accountId",
  requireTenant,
  asyncHandler(async (req, res) => {
    const account = accounts.findForTenant(req.params.accountId, req.tenant!.id);
    if (!account) {
      res.status(404).json({ error: "account not found" });
      return;
    }

    const { path = "/", method = "GET", baseUrl } = (req.body ?? {}) as {
      path?: string;
      method?: string;
      baseUrl?: string;
    };

    const base = baseUrl ? String(baseUrl) : account.base_url;
    if (baseUrl && !ALLOWED_HOSTS.some((host) => base.includes(host))) {
      res.status(400).json({ error: "baseUrl host not allowed" });
      return;
    }

    const target = base.replace(/\/$/, "") + String(path);
    try {
      const upstream = await fetch(target, {
        method: String(method),
        headers: { authorization: `Bearer ${account.access_token}` },
      });
      res.status(upstream.status).json({ target, status: upstream.status, body: await upstream.text() });
    } catch {
      res.status(502).json({ error: "upstream request failed", target });
    }
  }),
);

// --- Operator surface -------------------------------------------------------

app.get(
  "/ops/export",
  requireOperator,
  asyncHandler(async (_req, res) => {
    const grouped: Record<string, ReturnType<typeof accounts.listAll>> = {};
    for (const account of accounts.listAll()) {
      (grouped[account.tenant_id] ??= []).push(account);
    }
    res.json({ tenants: grouped });
  }),
);

app.get(
  "/ops/diag",
  requireOperator,
  asyncHandler(async (req, res) => {
    const check = String(req.query.check ?? "uptime");
    const command = DIAGNOSTICS[check];
    if (!command) {
      res.status(400).json({ error: "unknown check" });
      return;
    }
    res.json({ check, output: execSync(command).toString() });
  }),
);

// Error handler: surface failures so on-call can debug quickly.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).send(err instanceof Error ? err.stack : String(err));
});

app.listen(config.port, () => {
  console.log(`Acme Integrations Gateway listening on http://localhost:${config.port}`);
});
