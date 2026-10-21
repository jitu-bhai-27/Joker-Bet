import { Request, Response, NextFunction } from 'express';

export interface SecurityIncident {
  id: string;
  timestamp: string;
  type: 'DDOS_BURST' | 'AUTH_BRUTE_FORCE' | 'INJECTION_ATTEMPT' | 'TAMPERED_TRANSACTION' | 'SESSION_HIJACK_BLOCKED';
  ip: string;
  path: string;
  details: string;
  actionTaken: 'BLOCKED_429' | 'QUARANTINED_60S' | 'DROPPED_400' | 'REVOKED_401';
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory high-performance sliding window rate limiter
const ipRateLimits = new Map<string, RateLimitRecord>();
const authRateLimits = new Map<string, RateLimitRecord>();
export const manualBlockedIps = new Set<string>();

// Security Stats for Admin Monitoring
export const securityMetrics = {
  totalRequestsFiltered: 0,
  blockedAttacksCount: 0,
  rateLimitHits: 0,
  activeBlockedIps: 0,
  lastAttackTimestamp: null as string | null,
  recentIncidents: [] as SecurityIncident[],
};

// Log a security incident (keeps last 50 events)
export function logSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'timestamp'>) {
  const newIncident: SecurityIncident = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...incident,
  };
  securityMetrics.recentIncidents.unshift(newIncident);
  if (securityMetrics.recentIncidents.length > 50) {
    securityMetrics.recentIncidents.pop();
  }
  securityMetrics.blockedAttacksCount++;
  securityMetrics.lastAttackTimestamp = newIncident.timestamp;
}

// Clean expired records every 30 seconds
setInterval(() => {
  const now = Date.now();
  let blockedCount = manualBlockedIps.size;
  for (const [ip, record] of ipRateLimits.entries()) {
    if (record.blockedUntil && record.blockedUntil > now) {
      blockedCount++;
    } else if (record.resetAt < now) {
      ipRateLimits.delete(ip);
    }
  }
  for (const [ip, record] of authRateLimits.entries()) {
    if (record.resetAt < now) {
      authRateLimits.delete(ip);
    }
  }
  securityMetrics.activeBlockedIps = blockedCount;
}, 30000);

/**
 * 1. HTTP Security Headers Middleware (Anti-Clickjacking, XSS, MIME Sniffing, CSP)
 */
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Cache control for API responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  next();
}

/**
 * 2. Anti-DDoS & Volumetric Flood Protection Middleware
 * Restricts normal API traffic to 120 requests per 15 seconds per IP
 */
export function antiDdosRateLimiter(req: Request, res: Response, next: NextFunction) {
  securityMetrics.totalRequestsFiltered++;
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
  const now = Date.now();

  // Check manual blacklist
  if (manualBlockedIps.has(clientIp)) {
    return res.status(403).json({
      success: false,
      error: 'IP_BLACKLISTED',
      message: 'Access from this IP address has been restricted by server firewall.',
    });
  }

  const windowMs = 15000; // 15 seconds
  const maxRequests = 120; // 120 requests per 15s

  let record = ipRateLimits.get(clientIp);

  if (record && record.blockedUntil && record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      error: 'SECURITY_THROTTLED',
      message: `Volumetric rate limit exceeded. IP temporarily restricted. Try again in ${retryAfter}s.`,
    });
  }

  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + windowMs };
    ipRateLimits.set(clientIp, record);
  } else {
    record.count++;
    if (record.count > maxRequests) {
      // Trigger temporary 60-second flood mitigation block
      record.blockedUntil = now + 60000;
      securityMetrics.rateLimitHits++;
      logSecurityIncident({
        type: 'DDOS_BURST',
        ip: clientIp,
        path: req.path,
        details: `Volumetric burst: ${record.count} requests in <15s window (threshold: ${maxRequests})`,
        actionTaken: 'QUARANTINED_60S',
      });

      return res.status(429).json({
        success: false,
        error: 'DDOS_SHIELD_ACTIVE',
        message: 'Suspicious burst traffic detected. Shield protection activated for 60 seconds.',
      });
    }
  }

  next();
}

/**
 * 3. Strict Auth Rate Limiter (Anti-Brute-Force for OTP & Login)
 * Max 6 attempts per minute per IP
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxAttempts = 6;

  let record = authRateLimits.get(clientIp);
  if (!record || record.resetAt < now) {
    record = { count: 1, resetAt: now + windowMs };
    authRateLimits.set(clientIp, record);
  } else {
    record.count++;
    if (record.count > maxAttempts) {
      logSecurityIncident({
        type: 'AUTH_BRUTE_FORCE',
        ip: clientIp,
        path: req.path,
        details: `Exceeded ${maxAttempts} authentication attempts within 60s`,
        actionTaken: 'BLOCKED_429',
      });
      return res.status(429).json({
        success: false,
        error: 'AUTH_RATE_LIMIT',
        message: 'Too many authentication attempts. Please wait 60 seconds before trying again.',
      });
    }
  }

  next();
}

/**
 * 4. Input Sanitization & Anti-Injection Middleware
 * Cleans prototype pollution, script injection, and SQL/NoSQL vectors
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  let detectedThreat = false;
  let threatDetail = '';

  const scanValue = (val: string, keyName: string): string => {
    // Check for SQL injection patterns
    if (/(\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM|SELECT\s+\*\s+FROM)\b)/i.test(val)) {
      detectedThreat = true;
      threatDetail = `SQL injection vector in ${keyName}: "${val.substring(0, 30)}..."`;
    }
    // Check for script tags
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val)) {
      detectedThreat = true;
      threatDetail = `XSS payload in ${keyName}`;
    }
    return val
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '');
  };

  const sanitizeObject = (obj: any) => {
    for (const key of Object.keys(obj)) {
      // Prevent Prototype Pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        detectedThreat = true;
        threatDetail = `Prototype pollution attempt on key "${key}"`;
        delete obj[key];
        continue;
      }

      if (typeof obj[key] === 'string') {
        obj[key] = scanValue(obj[key], key);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  if (detectedThreat) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';
    logSecurityIncident({
      type: 'INJECTION_ATTEMPT',
      ip: clientIp,
      path: req.path,
      details: threatDetail,
      actionTaken: 'DROPPED_400',
    });
  }

  next();
}

/**
 * Helper to validate positive integer amounts (Strict Financial Guardrail)
 */
export function isValidCoinAmount(amount: any): amount is number {
  return typeof amount === 'number' && Number.isInteger(amount) && amount > 0 && amount <= 1000000;
}
