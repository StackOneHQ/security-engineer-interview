import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { tenants } from "./repository.js";
import type { Tenant } from "./db.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: Tenant;
      operator?: { sub?: string; role: string };
    }
  }
}

function bearerToken(authorization?: string, apiKey?: string): string | undefined {
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length);
  return apiKey;
}

/** Authenticates a tenant by API key for customer-facing routes. */
export const requireTenant: RequestHandler = (req, res, next) => {
  const key = bearerToken(req.header("authorization"), req.header("x-api-key"));
  if (!key) {
    res.status(401).json({ error: "missing api key" });
    return;
  }
  const tenant = tenants.findByApiKey(key);
  if (!tenant) {
    res.status(401).json({ error: "invalid api key" });
    return;
  }
  req.tenant = tenant;
  next();
};

/** Authenticates a platform operator by signed session token for /ops routes. */
export const requireOperator: RequestHandler = (req, res, next) => {
  const token = bearerToken(req.header("authorization"), req.header("x-api-key"));
  if (!token) {
    res.status(401).json({ error: "missing operator token" });
    return;
  }
  try {
    const claims = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    if (claims.role !== "operator") {
      res.status(403).json({ error: "operator role required" });
      return;
    }
    req.operator = { sub: claims.sub, role: claims.role as string };
    next();
  } catch {
    res.status(401).json({ error: "invalid operator token" });
  }
};
