import { db, initSchema } from "../src/db.js";

// Reset and seed two tenants with linked connector accounts. Two tenants exist
// so cross-tenant behaviour is observable.
initSchema();
db.exec("DELETE FROM accounts; DELETE FROM tenants;");

const tenants = [
  { id: "tnt_initech", name: "Initech", api_key: "sk_live_initech_a1b2c3d4e5f6" },
  { id: "tnt_hooli", name: "Hooli", api_key: "sk_live_hooli_9z8y7x6w5v4u" },
];

const accounts = [
  {
    id: "acc_initech_hris",
    tenant_id: "tnt_initech",
    provider: "bamboohr",
    external_id: "initech-hr-1",
    base_url: "https://api.bamboohr.example.com",
    access_token: "bhr_at_7f3b1c9d24e6a8051f4a7b2e8d6c",
    refresh_token: "bhr_rt_2e8d6035a1c49c1f4a7b9e3f",
  },
  {
    id: "acc_initech_crm",
    tenant_id: "tnt_initech",
    provider: "salesforce",
    external_id: "initech-crm-1",
    base_url: "https://api.salesforce.example.com",
    access_token: "sf_at_b8a2f6035a1c49c1f4a70d5e",
    refresh_token: "sf_rt_6035a1c49c1f4a7b2e8d1b9c",
  },
  {
    id: "acc_hooli_hris",
    tenant_id: "tnt_hooli",
    provider: "workday",
    external_id: "hooli-hr-1",
    base_url: "https://api.workday.example.com",
    access_token: "wd_at_d24e6a8051f4a7b2e8d6035a",
    refresh_token: "wd_rt_a1c49c1f4a7b2e8d60359e3f",
  },
];

const insertTenant = db.prepare("INSERT INTO tenants (id, name, api_key) VALUES (@id, @name, @api_key)");
const insertAccount = db.prepare(
  `INSERT INTO accounts (id, tenant_id, provider, external_id, base_url, access_token, refresh_token)
   VALUES (@id, @tenant_id, @provider, @external_id, @base_url, @access_token, @refresh_token)`,
);

const seed = db.transaction(() => {
  for (const tenant of tenants) insertTenant.run(tenant);
  for (const account of accounts) insertAccount.run(account);
});
seed();

console.log(`Seeded ${tenants.length} tenants and ${accounts.length} accounts.`);
console.log("Tenant API keys:");
for (const tenant of tenants) console.log(`  ${tenant.name}: ${tenant.api_key}`);
