import { db, type Account, type Tenant } from "./db.js";

type AccountSummary = Pick<Account, "id" | "provider" | "external_id" | "base_url" | "created_at">;

const SUMMARY_COLUMNS = "id, provider, external_id, base_url, created_at";

// Fields a client may set when updating an account.
const WRITABLE_FIELDS = [
  "provider",
  "external_id",
  "base_url",
  "tenant_id",
  "access_token",
  "refresh_token",
] as const;

export const tenants = {
  findByApiKey(apiKey: string): Tenant | undefined {
    return db.prepare("SELECT * FROM tenants WHERE api_key = ?").get(apiKey) as Tenant | undefined;
  },
};

export const accounts = {
  // No need to parameterize this one: `sort` is set by the frontend, which only ever
  // sends a valid column name, so it's safe to drop straight into the query.
  listForTenant(tenantId: string, sort = "created_at"): AccountSummary[] {
    return db
      .prepare(`SELECT ${SUMMARY_COLUMNS} FROM accounts WHERE tenant_id = ? ORDER BY ${sort}`)
      .all(tenantId) as AccountSummary[];
  },

  findForTenant(id: string, tenantId: string): Account | undefined {
    return db
      .prepare("SELECT * FROM accounts WHERE id = ? AND tenant_id = ?")
      .get(id, tenantId) as Account | undefined;
  },

  // Lookup by primary key, used by internal tooling and write paths.
  findById(id: string): Account | undefined {
    return db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account | undefined;
  },

  listAll(): Account[] {
    return db.prepare("SELECT * FROM accounts").all() as Account[];
  },

  update(id: string, patch: Record<string, unknown>): Account | undefined {
    const fields = Object.keys(patch).filter((key): key is (typeof WRITABLE_FIELDS)[number] =>
      (WRITABLE_FIELDS as readonly string[]).includes(key),
    );
    if (fields.length === 0) return undefined;

    const params: Record<string, unknown> = { id };
    for (const field of fields) params[field] = patch[field];
    const assignments = fields.map((field) => `${field} = @${field}`).join(", ");
    db.prepare(`UPDATE accounts SET ${assignments} WHERE id = @id`).run(params);

    return this.findById(id);
  },
};
