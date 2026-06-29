// Central config. Values load from the environment in production and fall back
// to in-source defaults for local development.

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 4000,

  // HS256 signing secret for operator session tokens (see /ops routes).
  // Loaded from the environment in prod; this default is used in local dev.
  jwtSecret: process.env.JWT_SECRET ?? "acme-gateway",
};
