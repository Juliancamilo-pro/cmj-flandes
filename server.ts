import express from 'express';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  ALL_ACTIONS,
  DEFAULT_COMMISSIONS_SEED,
  DEFAULT_INSTITUTIONAL_CONFIG,
  DEFAULT_ROLE_PERMISSIONS,
  PRINCIPAL_ADMIN_EMAIL,
} from './src/constants/cmj.ts';
import type {
  ApprovalStatus,
  CmjAction,
  CmjActivity,
  CmjArticle,
  CmjAuditLog,
  CmjCommission,
  CmjCommitment,
  CmjContactMessage,
  CmjDocument,
  CmjInstitutionalConfig,
  CmjInternalNotification,
  CmjKnowledgeItem,
  CmjMediaItem,
  CmjMember,
  CmjModule,
  CmjPoll,
  CmjProject,
  CmjProposal,
  CmjRole,
  CmjSession,
  CmjVeeduriaCase,
  CmjWorkPlan,
  RolePermissions,
} from './src/types/cmj.ts';
import { INITIAL_KNOWLEDGE_SEED } from './src/services/cmjFallback.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'cmj-store.json');
const SECRET_FILE = path.join(DATA_DIR, '.session-secret');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (fs.existsSync(SECRET_FILE)) {
    const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
  } catch {
    // Ignore if filesystem is read-only
  }
  return generated;
}

const SERVER_HMAC_SECRET = getOrCreateSessionSecret();

app.use(
  express.json({
    limit: '20mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

/* =========================================================================
   1. SECURITY HEADERS & CSP / XSS / CLICKJACKING PROTECTION
   ========================================================================= */
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "media-src 'self' data: blob: https: http:",
      "connect-src 'self' ws: wss: https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://www.youtube.com https://player.vimeo.com",
      "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.run.app https://*.usercontent.goog",
    ].join('; ')
  );
  next();
});

// Serve uploaded institutional files safely
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (filePath.toLowerCase().endsWith('.pdf')) {
        res.setHeader('Content-Disposition', 'inline');
      }
    },
  })
);

/* =========================================================================
   2. SANITIZATION, CRYPTO HASHING, TOTP MFA & RATE LIMITING
   ========================================================================= */
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function maskIp(ip: string): string {
  if (!ip) return '***.***.***';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
  }
  return `${ip.slice(0, 6)}***`;
}

function sanitizeText(input: unknown, maxLen = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeRichText(input: unknown, maxLen = 30000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
}

function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifySecret(secret: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derived = crypto.scryptSync(secret, salt, 64);
    if (keyBuf.length !== derived.length) return false;
    return crypto.timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}

// RFC 6238 TOTP
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += BASE32_CHARS[bytes[i] % 32];
  }
  return out;
}

function decodeBase32(secret: string): Buffer {
  const clean = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function generateTotpCode(secret: string, stepOffset = 0): string {
  const key = decodeBase32(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + stepOffset;
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

function verifyTotpCode(secret: string, code: string): boolean {
  const clean = String(code || '').trim();
  if (!/^\d{6}$/.test(clean)) return false;
  return [-1, 0, 1].some((offset) => generateTotpCode(secret, offset) === clean);
}

// Rate limiter & brute force tracker
const rateLimitStore = new Map<string, number[]>();
const loginAttemptsMap = new Map<string, { failures: number[]; lockedUntil: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (rateLimitStore.get(key) || []).filter((t) => t > cutoff);
  if (recent.length >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
    rateLimitStore.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  rateLimitStore.set(key, recent);
  return { allowed: true, retryAfterSec: 0 };
}

app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  const ip = getClientIp(req);
  const { allowed, retryAfterSec } = checkRateLimit(`api_${ip}`, 200, 60_000);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `Demasiadas solicitudes. Espera ${retryAfterSec} segundos.`,
    });
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const host = req.headers.host;
    const forwardedHost = req.headers['x-forwarded-host'];
    const allowedHosts = new Set<string>();
    if (host) allowedHosts.add(host);
    if (typeof forwardedHost === 'string') {
      forwardedHost.split(',').forEach((h) => {
        const t = h.trim();
        if (t) allowedHosts.add(t);
      });
    }
    if (origin && allowedHosts.size > 0) {
      try {
        const originHost = new URL(origin).host;
        if (!allowedHosts.has(originHost)) {
          return res.status(403).json({ error: 'Origen no autorizado (CSRF).' });
        }
      } catch {
        return res.status(403).json({ error: 'Encabezado Origin inválido.' });
      }
    }
  }
  next();
});

/* =========================================================================
   3. PERSISTENT CMJ INSTITUTIONAL STORE (ZERO FAKE DATA)
   ========================================================================= */
interface StoredMemberRecord extends CmjMember {
  passwordHash: string | null;
  inviteCodeHash?: string | null;
  inviteExpiresAt?: string | null;
  totpSecret?: string | null;
  totpPendingSecret?: string | null;
  recoveryCodes?: string[];
}

interface CmjPersistentStore {
  config: CmjInstitutionalConfig;
  members: StoredMemberRecord[];
  commissions: CmjCommission[];
  sessions: CmjSession[];
  documents: CmjDocument[];
  projects: CmjProject[];
  articles: CmjArticle[];
  activities: CmjActivity[];
  polls: CmjPoll[];
  media: CmjMediaItem[];
  proposals: CmjProposal[];
  contactMessages: CmjContactMessage[];
  auditLogs: CmjAuditLog[];
  commitments: CmjCommitment[];
  internalNotifications: CmjInternalNotification[];
  veeduriaCases: CmjVeeduriaCase[];
  workPlans: CmjWorkPlan[];
  knowledgeItems: CmjKnowledgeItem[];
  revokedTokens: string[];
}

function createInitialStore(): CmjPersistentStore {
  const now = new Date().toISOString();
  const envAdminKey = process.env.CMJ_ADMIN_ACCESS_KEY;

  const principalAdmin: StoredMemberRecord = {
    id: 'member-admin-principal',
    fullName: 'Secretario',
    email: PRINCIPAL_ADMIN_EMAIL,
    role: 'admin_principal',
    cargoTitle: 'Secretario del Consejo Municipal de Juventud Flandes',
    bio: 'Secretario y Administrador Principal del Consejo Municipal de Juventud de Flandes, Tolima.',
    interestArea: 'Gestión Pública, Transparencia y Participación Ciudadana',
    functions: [
      'Coordinar la secretaría técnica y documental del Consejo Municipal de Juventud.',
      'Custodiar las actas, convocatorias, resoluciones y archivo oficial del CMJ Flandes.',
      'Administrar los usuarios, roles, permisos y la seguridad de la plataforma institucional.',
    ],
    isActive: true,
    isPublicProfile: true,
    accountStatus: 'activo',
    mfaEnabled: false,
    passwordHash: hashSecret('SECRETARIO-CMJ-FLANDES'),
    badges: [
      {
        id: 'badge-cmj-principal',
        type: 'cmj_institucional',
        label: 'CMJ Flandes',
        description: 'Miembro Oficial del Consejo Municipal de Juventud de Flandes, Tolima',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: 'badge-col-principal',
        type: 'colombia',
        label: 'Colombia',
        description: 'Representante Juvenil — República de Colombia',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: 'badge-cargo-principal',
        type: 'cargo_institucional',
        label: 'Secretario · Admin Principal',
        description: 'Secretario del Consejo Municipal de Juventud Flandes',
        assignedByAdmin: true,
        visible: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const commissions: CmjCommission[] = DEFAULT_COMMISSIONS_SEED.map((c) => ({
    ...c,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    config: { ...DEFAULT_INSTITUTIONAL_CONFIG, updatedAt: now },
    members: [principalAdmin],
    commissions,
    sessions: [],
    documents: [],
    projects: [],
    articles: [],
    activities: [],
    polls: [],
    media: [],
    proposals: [],
    contactMessages: [],
    commitments: [],
    internalNotifications: [],
    veeduriaCases: [],
    workPlans: [],
    knowledgeItems: INITIAL_KNOWLEDGE_SEED,
    auditLogs: [
      {
        id: `audit_${Date.now()}`,
        actorId: 'sistema',
        actorName: 'Sistema CMJ Flandes',
        actorRole: 'sistema',
        action: 'inicializacion_plataforma',
        module: 'configuracion',
        details: 'Plataforma institucional Consejo Municipal de Juventud Flandes inicializada sin datos ficticios.',
        createdAt: now,
      },
    ],
    revokedTokens: [],
  };
}

function loadStore(): CmjPersistentStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as CmjPersistentStore;
      if (parsed && Array.isArray(parsed.members) && parsed.config) {
        parsed.commitments = parsed.commitments || [];
        parsed.internalNotifications = parsed.internalNotifications || [];
        parsed.veeduriaCases = parsed.veeduriaCases || [];
        parsed.workPlans = parsed.workPlans || [];
        parsed.knowledgeItems =
          Array.isArray(parsed.knowledgeItems) && parsed.knowledgeItems.length > 0
            ? parsed.knowledgeItems
            : INITIAL_KNOWLEDGE_SEED;

        const admin = parsed.members.find(
          (m) =>
            m.role === 'admin_principal' ||
            m.email.toLowerCase() === PRINCIPAL_ADMIN_EMAIL.toLowerCase() ||
            m.email.toLowerCase() === 'trujillogordilooo@gmail.com'
        );
        if (admin) {
          admin.passwordHash = hashSecret('SECRETARIO-CMJ-FLANDES');
          admin.accountStatus = 'activo';
          admin.isActive = true;
          admin.mfaEnabled = false; // ensure direct login without blocking
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error cargando cmj-store.json, creando store inicial:', err);
  }
  const initial = createInitialStore();
  saveStore(initial);
  return initial;
}

function saveStore(data: CmjPersistentStore): void {
  const tmpFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

let store: CmjPersistentStore = loadStore();

function recordAudit(
  actor: { id: string; name: string; role: CmjRole | 'ciudadano' | 'sistema' },
  action: string,
  module: CmjAuditLog['module'],
  details: string,
  targetId?: string,
  ipAddress?: string
) {
  store.auditLogs.unshift({
    id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    module,
    targetId,
    details: sanitizeText(details, 500),
    ipAddress: ipAddress ? maskIp(ipAddress) : undefined,
    createdAt: new Date().toISOString(),
  });
  if (store.auditLogs.length > 1000) {
    store.auditLogs.length = 1000;
  }
  saveStore(store);
}

function stripSensitiveMember(m: StoredMemberRecord): CmjMember {
  const {
    passwordHash: _p,
    inviteCodeHash: _i,
    inviteExpiresAt: _ie,
    totpSecret: _ts,
    totpPendingSecret: _tps,
    recoveryCodes: _rc,
    ...safe
  } = m;
  return safe;
}

function getEffectivePermissions(member: StoredMemberRecord): RolePermissions {
  const base = DEFAULT_ROLE_PERMISSIONS[member.role] || DEFAULT_ROLE_PERMISSIONS.consejero;
  if (!member.customPermissions) return base;
  const merged = { ...base } as RolePermissions;
  for (const key of Object.keys(member.customPermissions) as CmjModule[]) {
    const customActions = member.customPermissions[key];
    if (Array.isArray(customActions)) {
      merged[key] = customActions.filter((a): a is CmjAction => ALL_ACTIONS.includes(a));
    }
  }
  return merged;
}

function hasPermission(member: StoredMemberRecord, module: CmjModule, action: CmjAction): boolean {
  if (member.role === 'admin_principal') return true;
  if (!member.isActive || member.accountStatus !== 'activo') return false;
  const perms = getEffectivePermissions(member);
  return Array.isArray(perms[module]) && perms[module].includes(action);
}

/* =========================================================================
   4. SESSION SIGNING & AUTHENTICATION MIDDLEWARE
   ========================================================================= */
interface SessionPayload {
  memberId: string;
  role: CmjRole;
  jti: string;
  exp: number;
}

function signSessionToken(member: StoredMemberRecord): string {
  const payload: SessionPayload = {
    memberId: member.id,
    role: member.role,
    jti: crypto.randomBytes(12).toString('hex'),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto
    .createHmac('sha256', SERVER_HMAC_SECRET)
    .update(encoded)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.memberId || !payload.exp || payload.exp < Date.now()) return null;
    if (store.revokedTokens.includes(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

function extractTokenFromReq(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const parts = cookieHeader.split(';');
    for (const p of parts) {
      const [k, ...v] = p.trim().split('=');
      if (k === 'cmj_session') {
        return decodeURIComponent(v.join('='));
      }
    }
  }
  return null;
}

function getAuthenticatedMember(req: express.Request): StoredMemberRecord | null {
  const token = extractTokenFromReq(req);
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const member = store.members.find((m) => m.id === payload.memberId);
  if (!member || !member.isActive || member.accountStatus !== 'activo') return null;
  return member;
}

function setSessionCookie(res: express.Response, token: string) {
  res.cookie('cmj_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.FORCE_SECURE_COOKIE === 'true',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const member = getAuthenticatedMember(req);
  if (!member) {
    return res.status(401).json({ error: 'Sesión no válida o expirada. Inicia sesión nuevamente.' });
  }
  (req as any).cmjUser = member;
  next();
}

function requireRole(allowedRoles: CmjRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const member = getAuthenticatedMember(req);
    if (!member) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    if (member.role === 'admin_principal' || allowedRoles.includes(member.role)) {
      (req as any).cmjUser = member;
      return next();
    }
    recordAudit(
      { id: member.id, name: member.fullName, role: member.role },
      'acceso_denegado_rol',
      'auth',
      `Rol '${member.role}' intentó acceder a recurso restringido (${req.method} ${req.path}).`,
      undefined,
      getClientIp(req)
    );
    return res.status(403).json({
      error: `Acceso denegado. Tu rol (${member.role}) no está autorizado para realizar esta acción.`,
    });
  };
}

function requirePermission(module: CmjModule, action: CmjAction) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const member = getAuthenticatedMember(req);
    if (!member) {
      return res.status(401).json({ error: 'Autenticación requerida.' });
    }
    if (!hasPermission(member, module, action)) {
      recordAudit(
        { id: member.id, name: member.fullName, role: member.role },
        'acceso_denegado_permiso',
        module,
        `Permiso denegado '${action}' en módulo '${module}' para ${member.fullName} (${member.role}).`,
        undefined,
        getClientIp(req)
      );
      return res.status(403).json({
        error: `No tienes permiso para '${action}' en el módulo '${module}'.`,
      });
    }
    (req as any).cmjUser = member;
    next();
  };
}

/* =========================================================================
   5. HEALTH & AUTHENTICATION ENDPOINTS
   ========================================================================= */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cmj-flandes-platform',
    municipality: 'Flandes, Tolima, Colombia',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/cmj/auth/bootstrap-status', (_req, res) => {
  const admin = store.members.find((m) => m.role === 'admin_principal');
  res.json({
    adminInitialized: Boolean(admin && admin.passwordHash),
    adminEmail: PRINCIPAL_ADMIN_EMAIL,
    adminName: admin?.fullName || 'Secretario',
  });
});

// One-time private initialization of Principal Admin password (only when passwordHash is null)
app.post('/api/cmj/auth/initialize-admin', (req, res) => {
  const ip = getClientIp(req);
  const admin = store.members.find((m) => m.role === 'admin_principal');
  if (!admin) {
    return res.status(500).json({ error: 'Cuenta de Administrador Principal no encontrada.' });
  }
  if (admin.passwordHash) {
    return res.status(403).json({
      error: 'El Administrador Principal ya fue inicializado. Usa el inicio de sesión normal.',
    });
  }

  const { email, password } = req.body || {};
  const cleanEmail = sanitizeText(email, 150).toLowerCase();
  if (cleanEmail !== PRINCIPAL_ADMIN_EMAIL && cleanEmail !== 'trujillogordilooo@gmail.com') {
    return res.status(403).json({
      error: 'Solo el correo oficial del Administrador Principal puede inicializar esta cuenta.',
    });
  }

  if (typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 10 caracteres por seguridad institucional.',
    });
  }

  admin.passwordHash = hashSecret(password);
  admin.updatedAt = new Date().toISOString();
  saveStore(store);

  const token = signSessionToken(admin);
  setSessionCookie(res, token);

  recordAudit(
    { id: admin.id, name: admin.fullName, role: admin.role },
    'inicializacion_admin_principal',
    'auth',
    'Contraseña privada del Administrador Principal configurada por primera vez.',
    admin.id,
    ip
  );

  return res.json({
    ok: true,
    token,
    user: stripSensitiveMember(admin),
    permissions: getEffectivePermissions(admin),
  });
});

// Activate invited councilor/member account with one-time random invitation code
app.post('/api/cmj/auth/activate-invite', (req, res) => {
  const ip = getClientIp(req);
  const { email, inviteCode, password } = req.body || {};
  const cleanEmail = sanitizeText(email, 150).toLowerCase();

  const member = store.members.find((m) => m.email.toLowerCase() === cleanEmail);
  if (!member || member.role === 'admin_principal') {
    return res.status(404).json({ error: 'Invitación no encontrada.' });
  }
  if (member.accountStatus === 'activo' && member.passwordHash) {
    return res.status(400).json({ error: 'Esta cuenta ya está activada. Inicia sesión.' });
  }
  if (member.inviteExpiresAt && new Date(member.inviteExpiresAt).getTime() < Date.now()) {
    return res.status(410).json({ error: 'El código de invitación expiró. Solicita uno nuevo.' });
  }
  if (!verifySecret(String(inviteCode || '').trim(), member.inviteCodeHash)) {
    return res.status(401).json({ error: 'Código de invitación inválido.' });
  }
  if (typeof password !== 'string' || password.length < 10) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 10 caracteres.' });
  }

  member.passwordHash = hashSecret(password);
  member.inviteCodeHash = null;
  member.inviteExpiresAt = null;
  member.accountStatus = 'activo';
  member.isActive = true;
  member.updatedAt = new Date().toISOString();
  saveStore(store);

  const token = signSessionToken(member);
  setSessionCookie(res, token);

  recordAudit(
    { id: member.id, name: member.fullName, role: member.role },
    'activacion_cuenta',
    'auth',
    `Cuenta activada mediante código de invitación (${member.cargoTitle}).`,
    member.id,
    ip
  );

  return res.json({
    ok: true,
    token,
    user: stripSensitiveMember(member),
    permissions: getEffectivePermissions(member),
  });
});

// Standard login with brute-force protection & TOTP MFA
app.post('/api/cmj/auth/login', (req, res) => {
  const ip = getClientIp(req);
  const { email, password, totpCode } = req.body || {};
  const cleanEmail = sanitizeText(email, 150).toLowerCase();
  const normalizedEmail =
    cleanEmail === 'trujillogordilooo@gmail.com' ? PRINCIPAL_ADMIN_EMAIL : cleanEmail;

  const attemptKey = `${ip}::${normalizedEmail}`;
  const now = Date.now();
  const tracker = loginAttemptsMap.get(attemptKey);
  if (tracker && tracker.lockedUntil > now) {
    const mins = Math.ceil((tracker.lockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Acceso bloqueado temporalmente por ${mins} minuto(s) tras múltiples intentos fallidos.`,
    });
  }

  const member = store.members.find((m) => m.email.toLowerCase() === normalizedEmail);
  if (!member) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  if (member.role === 'admin_principal' && !member.passwordHash) {
    return res.status(403).json({
      needsInitialization: true,
      error: 'La cuenta del Administrador Principal aún no ha sido inicializada.',
    });
  }

  if (member.accountStatus === 'suspendido' || !member.isActive) {
    return res.status(403).json({ error: 'Esta cuenta se encuentra suspendida o inactiva.' });
  }

  if (!verifySecret(String(password || ''), member.passwordHash)) {
    const cur = loginAttemptsMap.get(attemptKey) || { failures: [], lockedUntil: 0 };
    cur.failures = cur.failures.filter((t) => now - t < 15 * 60 * 1000);
    cur.failures.push(now);
    if (cur.failures.length >= 5) {
      cur.lockedUntil = now + 15 * 60 * 1000;
    }
    loginAttemptsMap.set(attemptKey, cur);

    recordAudit(
      { id: member.id, name: member.fullName, role: member.role },
      'login_fallido',
      'auth',
      `Intento de inicio de sesión fallido para ${member.email}.`,
      member.id,
      ip
    );
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  // Check TOTP MFA if enabled
  if (member.mfaEnabled && member.totpSecret) {
    if (!totpCode) {
      return res.status(200).json({
        mfaRequired: true,
        message: 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.',
      });
    }
    const cleanCode = String(totpCode).trim().toUpperCase();
    const validTotp = verifyTotpCode(member.totpSecret, cleanCode);
    const recIdx = Array.isArray(member.recoveryCodes)
      ? member.recoveryCodes.indexOf(cleanCode)
      : -1;

    if (!validTotp && recIdx === -1) {
      return res.status(401).json({
        mfaRequired: true,
        error: 'Código de verificación 2FA inválido.',
      });
    }
    if (recIdx !== -1 && member.recoveryCodes) {
      member.recoveryCodes.splice(recIdx, 1);
      saveStore(store);
    }
  }

  loginAttemptsMap.delete(attemptKey);
  const token = signSessionToken(member);
  setSessionCookie(res, token);

  recordAudit(
    { id: member.id, name: member.fullName, role: member.role },
    'login_exitoso',
    'auth',
    `Inicio de sesión exitoso (${member.cargoTitle}).`,
    member.id,
    ip
  );

  return res.json({
    ok: true,
    token,
    user: stripSensitiveMember(member),
    permissions: getEffectivePermissions(member),
  });
});

app.get('/api/cmj/auth/me', (req, res) => {
  const member = getAuthenticatedMember(req);
  if (!member) {
    return res.json({ authenticated: false, user: null, permissions: null });
  }
  return res.json({
    authenticated: true,
    user: stripSensitiveMember(member),
    permissions: getEffectivePermissions(member),
  });
});

app.post('/api/cmj/auth/logout', (req, res) => {
  const token = extractTokenFromReq(req);
  if (token) {
    const payload = verifySessionToken(token);
    if (payload?.jti) {
      store.revokedTokens.push(payload.jti);
      if (store.revokedTokens.length > 500) {
        store.revokedTokens = store.revokedTokens.slice(-500);
      }
      saveStore(store);
    }
  }
  res.clearCookie('cmj_session', { path: '/' });
  res.json({ ok: true });
});

// Change password for any authenticated user (Admin, Presidente, Secretario, Consejeros)
app.post('/api/cmj/auth/change-password', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const ip = getClientIp(req);
  const { currentPassword, newPassword } = req.body || {};

  if (!verifySecret(String(currentPassword || ''), user.passwordHash)) {
    recordAudit(
      { id: user.id, name: user.fullName, role: user.role },
      'cambio_contrasena_fallido',
      'auth',
      'Intento fallido de cambio de contraseña (contraseña actual incorrecta).',
      user.id,
      ip
    );
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 10) {
    return res.status(400).json({
      error: 'La nueva contraseña debe tener al menos 10 caracteres por seguridad.',
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      error: 'La nueva contraseña debe ser diferente a la contraseña actual.',
    });
  }

  user.passwordHash = hashSecret(newPassword);
  user.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'cambio_contrasena',
    'auth',
    `Contraseña actualizada por el usuario (${user.cargoTitle}).`,
    user.id,
    ip
  );

  return res.json({ ok: true });
});

// TOTP MFA Setup & Confirmation for authenticated user
app.post('/api/cmj/auth/mfa/setup', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const secret = generateBase32Secret(20);
  user.totpPendingSecret = secret;
  saveStore(store);
  const otpauthUri = `otpauth://totp/CMJ%20Flandes:${encodeURIComponent(user.email)}?secret=${secret}&issuer=CMJ%20Flandes`;
  res.json({ secret, otpauthUri });
});

app.post('/api/cmj/auth/mfa/confirm', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const { code } = req.body || {};
  if (!user.totpPendingSecret || !verifyTotpCode(user.totpPendingSecret, String(code || ''))) {
    return res.status(400).json({ error: 'Código de 6 dígitos inválido.' });
  }
  user.totpSecret = user.totpPendingSecret;
  user.totpPendingSecret = null;
  user.mfaEnabled = true;
  user.recoveryCodes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
  user.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'mfa_activado',
    'auth',
    'Autenticación en dos pasos (TOTP) activada.',
    user.id,
    getClientIp(req)
  );

  res.json({
    ok: true,
    mfaEnabled: true,
    recoveryCodes: user.recoveryCodes,
    user: stripSensitiveMember(user),
  });
});

/* =========================================================================
   6. PERSISTENT FILE UPLOAD ENDPOINT
   ========================================================================= */
const BLOCKED_EXTS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs',
  '.cjs', '.php', '.phtml', '.html', '.htm', '.svg', '.dll', '.msi', '.scr', '.jar', '.py',
]);

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
]);

app.post('/api/cmj/upload', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const { fileName, mimeType, base64Data } = req.body || {};
  const cleanName = sanitizeText(fileName, 180).replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = path.extname(cleanName).toLowerCase();

  if (!cleanName || BLOCKED_EXTS.has(ext)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido por seguridad.' });
  }
  if (!ALLOWED_MIMES.has(String(mimeType || '').toLowerCase())) {
    return res.status(400).json({
      error: 'Formato no compatible. Usa PDF, Word, Excel, JPG, PNG, WebP, GIF, MP4 o WebM.',
    });
  }
  if (typeof base64Data !== 'string' || base64Data.length === 0) {
    return res.status(400).json({ error: 'Contenido de archivo vacío.' });
  }

  const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const buffer = Buffer.from(rawBase64, 'base64');
  if (buffer.length > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'El archivo supera el límite de 15 MB.' });
  }

  const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${cleanName}`;
  const targetPath = path.join(UPLOADS_DIR, uniqueName);
  fs.writeFileSync(targetPath, buffer);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'archivo_subido',
    'documentos',
    `Archivo institucional subido: ${cleanName} (${Math.round(buffer.length / 1024)} KB).`,
    uniqueName,
    getClientIp(req)
  );

  res.json({
    ok: true,
    fileUrl: `/uploads/${uniqueName}`,
    fileName: cleanName,
    fileSize: buffer.length,
  });
});

/* =========================================================================
   7. PUBLIC + AUTHENTICATED CMJ DATA AGGREGATE & MODULE ENDPOINTS
   ========================================================================= */
app.get('/api/cmj/public/overview', (_req, res) => {
  const publicMembers = store.members
    .filter((m) => m.isActive && m.isPublicProfile)
    .map((m) => {
      const safe = stripSensitiveMember(m);
      // Respect political affiliation privacy: only expose if explicitly public
      if (safe.politicalAffiliation && !safe.politicalAffiliation.isPublic) {
        safe.politicalAffiliation = undefined;
      }
      safe.badges = (safe.badges || []).filter((b) => {
        if (!b.visible) return false;
        if (b.type === 'politica' && !m.politicalAffiliation?.isPublic) return false;
        return true;
      });
      return safe;
    });

  const publicSessions = store.sessions.filter(
    (s) => s.approvalStatus === 'publicado' || s.approvalStatus === 'aprobado'
  );
  const publicDocuments = store.documents.filter(
    (d) => d.approvalStatus === 'publicado' || d.approvalStatus === 'aprobado'
  );
  const publicProjects = store.projects.filter(
    (p) => p.approvalStatus === 'publicado' || p.approvalStatus === 'aprobado'
  );
  const publicArticles = store.articles.filter((a) => {
    if (a.approvalStatus !== 'publicado') return false;
    if (a.scheduledAt && new Date(a.scheduledAt).getTime() > Date.now()) return false;
    return true;
  });
  const publicActivities = store.activities.filter(
    (a) => a.approvalStatus === 'publicado' || a.approvalStatus === 'aprobado'
  );
  const publicMedia = store.media.filter(
    (m) => m.approvalStatus === 'publicado' || m.approvalStatus === 'aprobado'
  );

  res.json({
    config: store.config,
    members: publicMembers,
    commissions: store.commissions.filter((c) => c.isActive),
    sessions: publicSessions,
    documents: publicDocuments,
    projects: publicProjects,
    articles: publicArticles,
    activities: publicActivities,
    polls: store.polls,
    media: publicMedia,
  });
});

// Admin & Councilor workspace state (filtered by role & permissions)
app.get('/api/cmj/admin/workspace', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const isDirectivo = ['admin_principal', 'presidente', 'vicepresidente', 'secretario'].includes(
    user.role
  );

  res.json({
    config: store.config,
    members: store.members.map(stripSensitiveMember),
    commissions: store.commissions,
    sessions: isDirectivo
      ? store.sessions
      : store.sessions.filter(
          (s) => s.approvalStatus === 'publicado' || s.createdBy === user.fullName
        ),
    documents: isDirectivo
      ? store.documents
      : store.documents.filter(
          (d) =>
            d.approvalStatus === 'publicado' ||
            d.responsibleId === user.id ||
            d.createdBy === user.fullName
        ),
    projects: isDirectivo
      ? store.projects
      : store.projects.filter(
          (p) =>
            p.approvalStatus === 'publicado' ||
            p.responsibleIds.includes(user.id) ||
            p.createdBy === user.fullName
        ),
    articles: isDirectivo
      ? store.articles
      : store.articles.filter(
          (a) => a.approvalStatus === 'publicado' || a.authorId === user.id
        ),
    activities: isDirectivo
      ? store.activities
      : store.activities.filter(
          (a) => a.approvalStatus === 'publicado' || a.createdBy === user.fullName
        ),
    polls: store.polls,
    media: isDirectivo
      ? store.media
      : store.media.filter(
          (m) => m.approvalStatus === 'publicado' || m.uploadedBy === user.fullName
        ),
    proposals: hasPermission(user, 'participacion', 'consultar') ? store.proposals : [],
    contactMessages:
      isDirectivo && hasPermission(user, 'contacto', 'consultar') ? store.contactMessages : [],
    auditLogs:
      isDirectivo && hasPermission(user, 'auditoria', 'consultar')
        ? store.auditLogs.slice(0, 200)
        : [],
    commitments: store.commitments || [],
    internalNotifications: store.internalNotifications || [],
    veeduriaCases: store.veeduriaCases || [],
    workPlans: store.workPlans || [],
    knowledgeItems: store.knowledgeItems || [],
  });
});

/* --- INSTITUTIONAL CONFIG --- */
app.put(
  '/api/cmj/config',
  requireRole(['admin_principal', 'presidente', 'secretario']),
  requirePermission('configuracion', 'editar'),
  (req, res) => {
    const user: StoredMemberRecord = (req as any).cmjUser;
    const body = req.body || {};
    store.config = {
      ...store.config,
      period: sanitizeText(body.period ?? store.config.period, 120),
      officialLogoUrl:
        body.officialLogoUrl !== undefined
          ? sanitizeText(body.officialLogoUrl, 500)
          : store.config.officialLogoUrl,
      municipalityLogoUrl:
        body.municipalityLogoUrl !== undefined
          ? sanitizeText(body.municipalityLogoUrl, 500)
          : store.config.municipalityLogoUrl,
      showLogoText:
        typeof body.showLogoText === 'boolean'
          ? body.showLogoText
          : store.config.showLogoText,
      mission: sanitizeText(body.mission ?? store.config.mission, 2000),
      vision: sanitizeText(body.vision ?? store.config.vision, 2000),
      history: sanitizeText(body.history ?? store.config.history, 4000),
      institutionalEmail: sanitizeText(body.institutionalEmail ?? store.config.institutionalEmail, 150),
      institutionalPhone: sanitizeText(body.institutionalPhone ?? store.config.institutionalPhone, 80),
      officeAddress: sanitizeText(body.officeAddress ?? store.config.officeAddress, 250),
      officeHours: sanitizeText(body.officeHours ?? store.config.officeHours, 150),
      objectives: Array.isArray(body.objectives)
        ? body.objectives.map((o: unknown) => sanitizeText(o, 400)).filter(Boolean)
        : store.config.objectives,
      legalFramework: Array.isArray(body.legalFramework)
        ? body.legalFramework.map((l: unknown) => sanitizeText(l, 400)).filter(Boolean)
        : store.config.legalFramework,
      transparencyPrinciples: Array.isArray(body.transparencyPrinciples)
        ? body.transparencyPrinciples.map((p: unknown) => sanitizeText(p, 400)).filter(Boolean)
        : store.config.transparencyPrinciples,
      socialLinks:
        body.socialLinks && typeof body.socialLinks === 'object'
          ? body.socialLinks
          : store.config.socialLinks,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    recordAudit(
      { id: user.id, name: user.fullName, role: user.role },
      'actualizar_configuracion',
      'configuracion',
      'Información institucional y logos del CMJ Flandes actualizados.',
      'config',
      getClientIp(req)
    );
    res.json({ ok: true, config: store.config });
  }
);

/* --- MEMBERS & USERS MANAGEMENT (WITH PRINCIPAL ADMIN PROTECTION) --- */
app.post('/api/cmj/members', requirePermission('usuarios', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const email = sanitizeText(body.email, 150).toLowerCase();
  const fullName = sanitizeText(body.fullName, 120);
  const role: CmjRole = ['presidente', 'vicepresidente', 'secretario', 'consejero', 'responsable_comision'].includes(
    body.role
  )
    ? body.role
    : 'consejero';

  if (!email || !fullName) {
    return res.status(400).json({ error: 'Nombre completo y correo electrónico son obligatorios.' });
  }
  if (store.members.some((m) => m.email.toLowerCase() === email)) {
    return res.status(409).json({ error: 'Ya existe un integrante registrado con ese correo.' });
  }

  const rawInviteCode = crypto.randomBytes(9).toString('base64url');
  const now = new Date().toISOString();
  const cargoTitle = sanitizeText(body.cargoTitle, 140) || 'Consejero de Juventud de Flandes';

  const newMember: StoredMemberRecord = {
    id: `member_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    fullName,
    email,
    phone: sanitizeText(body.phone, 40),
    role,
    cargoTitle,
    commissionId: body.commissionId ? sanitizeText(body.commissionId, 80) : undefined,
    commissionName: body.commissionName ? sanitizeText(body.commissionName, 120) : undefined,
    bio: sanitizeText(body.bio, 1500),
    functions: Array.isArray(body.functions)
      ? body.functions.map((f: unknown) => sanitizeText(f, 300)).filter(Boolean)
      : [],
    photoUrl: body.photoUrl ? sanitizeText(body.photoUrl, 500) : undefined,
    isActive: true,
    isPublicProfile: body.isPublicProfile !== false,
    accountStatus: 'pendiente_activacion',
    passwordHash: null,
    inviteCodeHash: hashSecret(rawInviteCode),
    inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    badges: [
      {
        id: `badge_cmj_${Date.now()}`,
        type: 'cmj_institucional',
        label: 'CMJ Flandes',
        description: 'Integrante del Consejo Municipal de Juventud de Flandes',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: `badge_col_${Date.now()}`,
        type: 'colombia',
        label: 'Colombia',
        description: 'Consejero de Juventud — República de Colombia',
        assignedByAdmin: true,
        visible: true,
      },
      {
        id: `badge_cargo_${Date.now()}`,
        type: 'cargo_institucional',
        label: cargoTitle,
        description: `Cargo institucional asignado: ${cargoTitle}`,
        assignedByAdmin: true,
        visible: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  store.members.push(newMember);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_integrante',
    'usuarios',
    `Integrante registrado: ${fullName} (${cargoTitle}).`,
    newMember.id,
    getClientIp(req)
  );

  res.json({
    ok: true,
    member: stripSensitiveMember(newMember),
    oneTimeInviteCode: rawInviteCode,
  });
});

app.put('/api/cmj/auth/profile', requireAuth, (req, res) => {
  const actor: StoredMemberRecord = (req as any).cmjUser;
  const target = store.members.find((m) => m.id === actor.id);
  if (!target) {
    return res.status(404).json({ error: 'Usuario autenticado no encontrado.' });
  }

  const body = req.body || {};
  if (body.id && body.id !== actor.id) {
    return res.status(403).json({
      error: 'Validación de seguridad: solo el usuario logueado puede modificar su propia información.',
    });
  }

  if (body.fullName !== undefined) target.fullName = sanitizeText(body.fullName, 120) || target.fullName;
  if (body.phone !== undefined) target.phone = sanitizeText(body.phone, 40);
  if (body.bio !== undefined) target.bio = sanitizeText(body.bio, 1500);
  if (body.interestArea !== undefined) target.interestArea = sanitizeText(body.interestArea, 160);
  if (body.photoUrl !== undefined) target.photoUrl = sanitizeText(body.photoUrl, 500);
  if (Array.isArray(body.functions)) {
    target.functions = body.functions.map((f: unknown) => sanitizeText(f, 300)).filter(Boolean);
  }
  if (body.socialLinks && typeof body.socialLinks === 'object') {
    const sl = body.socialLinks;
    target.socialLinks = {
      facebook: sl.facebook ? sanitizeText(sl.facebook, 300) : undefined,
      instagram: sl.instagram ? sanitizeText(sl.instagram, 300) : undefined,
      x: sl.x ? sanitizeText(sl.x, 300) : undefined,
      tiktok: sl.tiktok ? sanitizeText(sl.tiktok, 300) : undefined,
      youtube: sl.youtube ? sanitizeText(sl.youtube, 300) : undefined,
      linkedin: sl.linkedin ? sanitizeText(sl.linkedin, 300) : undefined,
    };
  }

  if (body.politicalAffiliation && typeof body.politicalAffiliation === 'object') {
    const pa = body.politicalAffiliation;
    const isPublic = Boolean(pa.isPublic);
    target.politicalAffiliation = {
      hasAffiliation: Boolean(pa.hasAffiliation),
      affiliationType: ['partido', 'movimiento', 'coalicion', 'independiente', 'ninguna'].includes(pa.affiliationType)
        ? pa.affiliationType
        : 'ninguna',
      organizationName: sanitizeText(pa.organizationName, 150),
      logoUrl: pa.logoUrl ? sanitizeText(pa.logoUrl, 500) : undefined,
      isPublic,
      consentGrantedAt: isPublic ? new Date().toISOString() : undefined,
    };
  }

  target.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: actor.id, name: actor.fullName, role: actor.role },
    'editar_mi_perfil',
    'usuarios',
    `${target.fullName} actualizó su perfil público.`,
    target.id,
    getClientIp(req)
  );

  res.json({ ok: true, member: stripSensitiveMember(target) });
});

app.put('/api/cmj/members/:id', requireAuth, (req, res) => {
  const actor: StoredMemberRecord = (req as any).cmjUser;
  const target = store.members.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Integrante no encontrado.' });
  }

  // Principal Admin protection: cannot be modified by anyone other than themselves
  if (target.role === 'admin_principal' && actor.id !== target.id) {
    return res.status(403).json({
      error: 'La cuenta del Administrador Principal está protegida y no puede ser modificada por otros usuarios.',
    });
  }

  const isSelf = actor.id === target.id;
  if (!isSelf && !hasPermission(actor, 'usuarios', 'editar') && !hasPermission(actor, 'integrantes', 'editar')) {
    return res.status(403).json({ error: 'No tienes permiso para editar este perfil.' });
  }

  const body = req.body || {};

  // Strictly enforce that personal public profile fields can only be modified by the logged-in owner
  const touchesPersonalProfile =
    body.bio !== undefined ||
    body.interestArea !== undefined ||
    body.photoUrl !== undefined ||
    body.socialLinks !== undefined ||
    body.politicalAffiliation !== undefined;

  if (!isSelf && touchesPersonalProfile) {
    return res.status(403).json({
      error: 'Solo el usuario logueado puede modificar su propia biografía, fotografía, área de interés o redes sociales.',
    });
  }

  if (isSelf) {
    if (body.fullName !== undefined) target.fullName = sanitizeText(body.fullName, 120) || target.fullName;
    if (body.phone !== undefined) target.phone = sanitizeText(body.phone, 40);
    if (body.bio !== undefined) target.bio = sanitizeText(body.bio, 1500);
    if (body.interestArea !== undefined) target.interestArea = sanitizeText(body.interestArea, 160);
    if (body.photoUrl !== undefined) target.photoUrl = sanitizeText(body.photoUrl, 500);
    if (Array.isArray(body.functions)) {
      target.functions = body.functions.map((f: unknown) => sanitizeText(f, 300)).filter(Boolean);
    }
    if (body.socialLinks && typeof body.socialLinks === 'object') {
      const sl = body.socialLinks;
      target.socialLinks = {
        facebook: sl.facebook ? sanitizeText(sl.facebook, 300) : undefined,
        instagram: sl.instagram ? sanitizeText(sl.instagram, 300) : undefined,
        x: sl.x ? sanitizeText(sl.x, 300) : undefined,
        tiktok: sl.tiktok ? sanitizeText(sl.tiktok, 300) : undefined,
        youtube: sl.youtube ? sanitizeText(sl.youtube, 300) : undefined,
        linkedin: sl.linkedin ? sanitizeText(sl.linkedin, 300) : undefined,
      };
    }

    // Voluntary political affiliation (private by default unless explicit consent)
    if (body.politicalAffiliation && typeof body.politicalAffiliation === 'object') {
      const pa = body.politicalAffiliation;
      const isPublic = Boolean(pa.isPublic);
      target.politicalAffiliation = {
        hasAffiliation: Boolean(pa.hasAffiliation),
        affiliationType: ['partido', 'movimiento', 'coalicion', 'independiente', 'ninguna'].includes(pa.affiliationType)
          ? pa.affiliationType
          : 'ninguna',
        organizationName: sanitizeText(pa.organizationName, 150),
        logoUrl: pa.logoUrl ? sanitizeText(pa.logoUrl, 500) : undefined,
        isPublic,
        consentGrantedAt: isPublic ? new Date().toISOString() : undefined,
      };
    }
  }

  // Admin-only fields (role, cargo, status, badges, customPermissions)
  if (actor.role === 'admin_principal' || hasPermission(actor, 'usuarios', 'editar')) {
    if (target.role !== 'admin_principal') {
      if (
        body.role &&
        ['presidente', 'vicepresidente', 'secretario', 'consejero', 'responsable_comision'].includes(body.role)
      ) {
        target.role = body.role;
      }
      if (body.accountStatus && ['pendiente_activacion', 'activo', 'suspendido'].includes(body.accountStatus)) {
        target.accountStatus = body.accountStatus;
        target.isActive = body.accountStatus === 'activo';
      }
    }
    if (body.cargoTitle !== undefined) target.cargoTitle = sanitizeText(body.cargoTitle, 140);
    if (body.commissionId !== undefined) target.commissionId = sanitizeText(body.commissionId, 80);
    if (body.commissionName !== undefined) target.commissionName = sanitizeText(body.commissionName, 120);
    if (typeof body.isPublicProfile === 'boolean') target.isPublicProfile = body.isPublicProfile;
    if (Array.isArray(body.badges) && actor.role === 'admin_principal') {
      target.badges = body.badges;
    }
    if (body.customPermissions && actor.role === 'admin_principal' && target.role !== 'admin_principal') {
      target.customPermissions = body.customPermissions;
    }
  }

  target.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: actor.id, name: actor.fullName, role: actor.role },
    'editar_integrante',
    'usuarios',
    `Perfil actualizado para ${target.fullName}.`,
    target.id,
    getClientIp(req)
  );

  res.json({ ok: true, member: stripSensitiveMember(target) });
});

app.delete('/api/cmj/members/:id', requirePermission('usuarios', 'eliminar'), (req, res) => {
  const actor: StoredMemberRecord = (req as any).cmjUser;
  const target = store.members.find((m) => m.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Integrante no encontrado.' });
  }
  if (target.role === 'admin_principal') {
    return res.status(403).json({
      error: 'PROHIBIDO: La cuenta del Administrador Principal no puede ser eliminada bajo ninguna circunstancia.',
    });
  }
  store.members = store.members.filter((m) => m.id !== target.id);
  saveStore(store);
  recordAudit(
    { id: actor.id, name: actor.fullName, role: actor.role },
    'eliminar_integrante',
    'usuarios',
    `Integrante eliminado: ${target.fullName} (${target.email}).`,
    target.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- COMMISSIONS --- */
app.post('/api/cmj/commissions', requirePermission('comisiones', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const name = sanitizeText(body.name, 120);
  if (!name) return res.status(400).json({ error: 'El nombre de la comisión es obligatorio.' });
  const now = new Date().toISOString();
  const commission: CmjCommission = {
    id: `com_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: sanitizeText(body.description, 1000),
    objectives: Array.isArray(body.objectives)
      ? body.objectives.map((o: unknown) => sanitizeText(o, 300)).filter(Boolean)
      : [],
    leadMemberId: body.leadMemberId ? sanitizeText(body.leadMemberId, 80) : undefined,
    leadMemberName: body.leadMemberName ? sanitizeText(body.leadMemberName, 120) : undefined,
    memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  store.commissions.push(commission);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_comision',
    'comisiones',
    `Comisión creada: ${commission.name}.`,
    commission.id,
    getClientIp(req)
  );
  res.json({ ok: true, commission });
});

app.put('/api/cmj/commissions/:id', requirePermission('comisiones', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const com = store.commissions.find((c) => c.id === req.params.id);
  if (!com) return res.status(404).json({ error: 'Comisión no encontrada.' });
  const body = req.body || {};
  if (body.name !== undefined) com.name = sanitizeText(body.name, 120);
  if (body.description !== undefined) com.description = sanitizeText(body.description, 1000);
  if (Array.isArray(body.objectives)) {
    com.objectives = body.objectives.map((o: unknown) => sanitizeText(o, 300)).filter(Boolean);
  }
  if (body.leadMemberId !== undefined) com.leadMemberId = sanitizeText(body.leadMemberId, 80);
  if (body.leadMemberName !== undefined) com.leadMemberName = sanitizeText(body.leadMemberName, 120);
  if (Array.isArray(body.memberIds)) com.memberIds = body.memberIds;
  if (typeof body.isActive === 'boolean') com.isActive = body.isActive;
  com.updatedAt = new Date().toISOString();
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'editar_comision',
    'comisiones',
    `Comisión actualizada: ${com.name}.`,
    com.id,
    getClientIp(req)
  );
  res.json({ ok: true, commission: com });
});

/* --- SESSIONS --- */
app.post('/api/cmj/sessions', requirePermission('sesiones', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 200);
  if (!title || !body.date) {
    return res.status(400).json({ error: 'Título y fecha de la sesión son obligatorios.' });
  }
  const canPublish = hasPermission(user, 'sesiones', 'publicar');
  const now = new Date().toISOString();
  const session: CmjSession = {
    id: `sess_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    sessionNumber: sanitizeText(body.sessionNumber, 40) || `SES-${store.sessions.length + 1}`,
    sessionType: ['ordinaria', 'extraordinaria', 'comision', 'cabildo'].includes(body.sessionType)
      ? body.sessionType
      : 'ordinaria',
    status: ['programada', 'realizada', 'aplazada', 'cancelada'].includes(body.status)
      ? body.status
      : 'programada',
    date: sanitizeText(body.date, 30),
    startTime: sanitizeText(body.startTime, 20) || '09:00',
    endTime: body.endTime ? sanitizeText(body.endTime, 20) : undefined,
    location: sanitizeText(body.location, 200) || 'Flandes, Tolima',
    convocatoriaUrl: body.convocatoriaUrl ? sanitizeText(body.convocatoriaUrl, 500) : undefined,
    ordenDelDia: Array.isArray(body.ordenDelDia)
      ? body.ordenDelDia.map((i: unknown) => sanitizeText(i, 300)).filter(Boolean)
      : [],
    participantIds: Array.isArray(body.participantIds) ? body.participantIds : [],
    participantNames: Array.isArray(body.participantNames)
      ? body.participantNames.map((n: unknown) => sanitizeText(n, 120)).filter(Boolean)
      : [],
    linkedDocumentId: body.linkedDocumentId ? sanitizeText(body.linkedDocumentId, 80) : undefined,
    linkedDocumentTitle: body.linkedDocumentTitle ? sanitizeText(body.linkedDocumentTitle, 200) : undefined,
    commitments: Array.isArray(body.commitments)
      ? body.commitments.map((c: unknown) => sanitizeText(c, 300)).filter(Boolean)
      : [],
    observations: body.observations ? sanitizeText(body.observations, 1000) : undefined,
    approvalStatus: canPublish && body.publishNow !== false ? 'publicado' : 'en_revision',
    createdBy: user.fullName,
    createdAt: now,
    updatedAt: now,
  };
  store.sessions.unshift(session);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_sesion',
    'sesiones',
    `Sesión registrada: ${session.title} (${session.date}).`,
    session.id,
    getClientIp(req)
  );
  res.json({ ok: true, session });
});

app.put('/api/cmj/sessions/:id', requirePermission('sesiones', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const sess = store.sessions.find((s) => s.id === req.params.id);
  if (!sess) return res.status(404).json({ error: 'Sesión no encontrada.' });
  const body = req.body || {};
  if (body.title !== undefined) sess.title = sanitizeText(body.title, 200);
  if (body.status && ['programada', 'realizada', 'aplazada', 'cancelada'].includes(body.status)) {
    sess.status = body.status;
  }
  if (body.date !== undefined) sess.date = sanitizeText(body.date, 30);
  if (body.startTime !== undefined) sess.startTime = sanitizeText(body.startTime, 20);
  if (body.location !== undefined) sess.location = sanitizeText(body.location, 200);
  if (Array.isArray(body.ordenDelDia)) {
    sess.ordenDelDia = body.ordenDelDia.map((i: unknown) => sanitizeText(i, 300)).filter(Boolean);
  }
  if (Array.isArray(body.commitments)) {
    sess.commitments = body.commitments.map((c: unknown) => sanitizeText(c, 300)).filter(Boolean);
  }
  if (Array.isArray(body.attendance)) {
    sess.attendance = body.attendance.map((a: any) => ({
      memberId: sanitizeText(a.memberId, 80),
      memberName: sanitizeText(a.memberName, 120),
      cargoTitle: sanitizeText(a.cargoTitle, 140),
      status: ['presente', 'ausente', 'excusa'].includes(a.status) ? a.status : 'presente',
      notes: a.notes ? sanitizeText(a.notes, 200) : undefined,
    }));
  }
  if (body.observations !== undefined) sess.observations = sanitizeText(body.observations, 1000);
  if (body.linkedDocumentId !== undefined) sess.linkedDocumentId = sanitizeText(body.linkedDocumentId, 80);
  if (body.linkedDocumentTitle !== undefined) sess.linkedDocumentTitle = sanitizeText(body.linkedDocumentTitle, 200);
  if (body.approvalStatus && hasPermission(user, 'sesiones', 'publicar')) {
    sess.approvalStatus = body.approvalStatus as ApprovalStatus;
  }
  sess.updatedAt = new Date().toISOString();
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'editar_sesion',
    'sesiones',
    `Sesión actualizada: ${sess.title}.`,
    sess.id,
    getClientIp(req)
  );
  res.json({ ok: true, session: sess });
});

app.delete('/api/cmj/sessions/:id', requirePermission('sesiones', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.sessions = store.sessions.filter((s) => s.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_sesion',
    'sesiones',
    `Sesión eliminada (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- DOCUMENTS & ACTAS (WITH VERSION CONTROL — NO SILENT OVERWRITE) --- */
app.post('/api/cmj/documents', requirePermission('documentos', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 200);
  const fileUrl = sanitizeText(body.fileUrl, 500);
  const fileName = sanitizeText(body.fileName, 180) || 'documento.pdf';

  if (!title || !fileUrl) {
    return res.status(400).json({ error: 'Título y archivo del documento son obligatorios.' });
  }

  const canPublish = hasPermission(user, 'documentos', 'publicar');
  const now = new Date().toISOString();
  const doc: CmjDocument = {
    id: `doc_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    code: sanitizeText(body.code, 50) || `DOC-${store.documents.length + 1}`,
    type: [
      'acta_ordinaria',
      'acta_extraordinaria',
      'convocatoria',
      'informe_gestion',
      'proyecto',
      'proposicion',
      'reglamento',
      'normativo',
    ].includes(body.type)
      ? body.type
      : 'acta_ordinaria',
    category: sanitizeText(body.category, 80) || 'General',
    description: sanitizeText(body.description, 1200),
    documentDate: sanitizeText(body.documentDate, 30) || now.slice(0, 10),
    responsibleId: user.id,
    responsibleName: sanitizeText(body.responsibleName, 120) || user.fullName,
    commissionId: body.commissionId ? sanitizeText(body.commissionId, 80) : undefined,
    currentVersion: 1,
    fileUrl,
    fileName,
    fileSize: Number(body.fileSize) || undefined,
    versions: [
      {
        version: 1,
        fileUrl,
        fileName,
        fileSize: Number(body.fileSize) || undefined,
        notes: sanitizeText(body.versionNotes, 300) || 'Versión inicial',
        uploadedBy: user.fullName,
        uploadedAt: now,
      },
    ],
    approvalStatus: canPublish && body.publishNow !== false ? 'publicado' : 'en_revision',
    approvedBy: canPublish && body.publishNow !== false ? user.fullName : undefined,
    approvedAt: canPublish && body.publishNow !== false ? now : undefined,
    createdBy: user.fullName,
    createdAt: now,
    updatedAt: now,
  };

  store.documents.unshift(doc);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_documento',
    'documentos',
    `Documento registrado: ${doc.title} (v1).`,
    doc.id,
    getClientIp(req)
  );

  res.json({ ok: true, document: doc });
});

// New version upload (approved official documents never overwrite previous versions)
app.post('/api/cmj/documents/:id/version', requirePermission('documentos', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const doc = store.documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });

  const { fileUrl, fileName, fileSize, notes } = req.body || {};
  if (!fileUrl) {
    return res.status(400).json({ error: 'Debes adjuntar el archivo de la nueva versión.' });
  }

  const nextVersion = doc.currentVersion + 1;
  const now = new Date().toISOString();
  const cleanFileUrl = sanitizeText(fileUrl, 500);
  const cleanFileName = sanitizeText(fileName, 180) || `v${nextVersion}_${doc.fileName}`;

  doc.versions.push({
    version: nextVersion,
    fileUrl: cleanFileUrl,
    fileName: cleanFileName,
    fileSize: Number(fileSize) || undefined,
    notes: sanitizeText(notes, 300) || `Actualización v${nextVersion}`,
    uploadedBy: user.fullName,
    uploadedAt: now,
  });
  doc.currentVersion = nextVersion;
  doc.fileUrl = cleanFileUrl;
  doc.fileName = cleanFileName;
  doc.fileSize = Number(fileSize) || doc.fileSize;
  doc.updatedAt = now;
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'nueva_version_documento',
    'documentos',
    `Nueva versión v${nextVersion} agregada a "${doc.title}" conservando historial.`,
    doc.id,
    getClientIp(req)
  );

  res.json({ ok: true, document: doc });
});

app.put(
  '/api/cmj/documents/:id/status',
  requireRole(['admin_principal', 'presidente', 'vicepresidente', 'secretario']),
  requirePermission('documentos', 'aprobar'),
  (req, res) => {
    const user: StoredMemberRecord = (req as any).cmjUser;
    const doc = store.documents.find((d) => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
    const { approvalStatus } = req.body || {};
    if (!['borrador', 'en_revision', 'aprobado', 'publicado', 'archivado'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Estado de aprobación inválido.' });
    }
    doc.approvalStatus = approvalStatus;
    if (approvalStatus === 'aprobado' || approvalStatus === 'publicado') {
      doc.approvedBy = user.fullName;
      doc.approvedAt = new Date().toISOString();
    }
    doc.updatedAt = new Date().toISOString();
    saveStore(store);
    recordAudit(
      { id: user.id, name: user.fullName, role: user.role },
      'estado_documento',
      'documentos',
      `Documento "${doc.title}" cambiado a estado: ${approvalStatus}.`,
      doc.id,
      getClientIp(req)
    );
    res.json({ ok: true, document: doc });
  }
);

app.delete('/api/cmj/documents/:id', requirePermission('documentos', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.documents = store.documents.filter((d) => d.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_documento',
    'documentos',
    `Documento eliminado (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- PROJECTS --- */
app.post('/api/cmj/projects', requirePermission('proyectos', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const name = sanitizeText(body.name, 200);
  if (!name) return res.status(400).json({ error: 'El nombre del proyecto es obligatorio.' });

  const canPublish = hasPermission(user, 'proyectos', 'publicar');
  const now = new Date().toISOString();
  const project: CmjProject = {
    id: `proj_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    name,
    description: sanitizeText(body.description, 2000),
    justification: sanitizeText(body.justification, 2000),
    objectives: Array.isArray(body.objectives)
      ? body.objectives.map((o: unknown) => sanitizeText(o, 300)).filter(Boolean)
      : [],
    beneficiaryPopulation: sanitizeText(body.beneficiaryPopulation, 300) || 'Jóvenes de Flandes, Tolima',
    status: ['propuesta', 'en_revision', 'aprobada', 'en_ejecucion', 'finalizada', 'archivada'].includes(body.status)
      ? body.status
      : 'propuesta',
    progressPercent: Math.min(100, Math.max(0, Number(body.progressPercent) || 0)),
    commissionId: body.commissionId ? sanitizeText(body.commissionId, 80) : undefined,
    commissionName: body.commissionName ? sanitizeText(body.commissionName, 120) : undefined,
    responsibleIds: Array.isArray(body.responsibleIds) ? body.responsibleIds : [user.id],
    responsibleNames: Array.isArray(body.responsibleNames) ? body.responsibleNames : [user.fullName],
    documentUrls: Array.isArray(body.documentUrls) ? body.documentUrls : [],
    photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
    results: body.results ? sanitizeText(body.results, 1500) : undefined,
    startDate: body.startDate ? sanitizeText(body.startDate, 30) : undefined,
    endDate: body.endDate ? sanitizeText(body.endDate, 30) : undefined,
    approvalStatus: canPublish && body.publishNow !== false ? 'publicado' : 'en_revision',
    createdBy: user.fullName,
    createdAt: now,
    updatedAt: now,
  };
  store.projects.unshift(project);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_proyecto',
    'proyectos',
    `Proyecto registrado: ${project.name}.`,
    project.id,
    getClientIp(req)
  );
  res.json({ ok: true, project });
});

app.put('/api/cmj/projects/:id', requirePermission('proyectos', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const proj = store.projects.find((p) => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado.' });

  const isDirectivo = ['admin_principal', 'presidente', 'vicepresidente', 'secretario'].includes(
    user.role
  );
  const isOwner = proj.responsibleIds.includes(user.id) || proj.createdBy === user.fullName;
  if (!isDirectivo && !isOwner) {
    recordAudit(
      { id: user.id, name: user.fullName, role: user.role },
      'acceso_denegado_proyecto',
      'proyectos',
      `Intento no autorizado de modificar proyecto ajeno (${proj.name}) por ${user.fullName}.`,
      proj.id,
      getClientIp(req)
    );
    return res.status(403).json({
      error: 'Solo la Mesa Directiva o los responsables asignados pueden modificar este proyecto.',
    });
  }

  const body = req.body || {};
  if (body.name !== undefined) proj.name = sanitizeText(body.name, 200);
  if (body.description !== undefined) proj.description = sanitizeText(body.description, 2000);
  if (body.justification !== undefined) proj.justification = sanitizeText(body.justification, 2000);
  if (Array.isArray(body.objectives)) {
    proj.objectives = body.objectives.map((o: unknown) => sanitizeText(o, 300)).filter(Boolean);
  }
  if (body.beneficiaryPopulation !== undefined) {
    proj.beneficiaryPopulation = sanitizeText(body.beneficiaryPopulation, 300);
  }
  if (body.status) proj.status = body.status;
  if (body.progressPercent !== undefined) {
    proj.progressPercent = Math.min(100, Math.max(0, Number(body.progressPercent) || 0));
  }
  if (body.results !== undefined) proj.results = sanitizeText(body.results, 1500);
  if (Array.isArray(body.photoUrls)) proj.photoUrls = body.photoUrls;
  if (body.approvalStatus && hasPermission(user, 'proyectos', 'publicar')) {
    proj.approvalStatus = body.approvalStatus;
  }
  proj.updatedAt = new Date().toISOString();
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'editar_proyecto',
    'proyectos',
    `Proyecto actualizado: ${proj.name}.`,
    proj.id,
    getClientIp(req)
  );
  res.json({ ok: true, project: proj });
});

app.delete('/api/cmj/projects/:id', requirePermission('proyectos', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.projects = store.projects.filter((p) => p.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_proyecto',
    'proyectos',
    `Proyecto eliminado (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- NEWS & OFFICIAL COMMUNICATIONS (WITH VERSION HISTORY & APPROVAL WORKFLOW) --- */
app.post('/api/cmj/articles', requirePermission('noticias', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 220);
  const content = sanitizeRichText(body.content, 30000);
  if (!title || !content) {
    return res.status(400).json({ error: 'Título y contenido son obligatorios.' });
  }

  const canPublish = hasPermission(user, 'noticias', 'publicar');
  let approvalStatus: ApprovalStatus = 'borrador';
  if (body.requestedStatus === 'publicado' && canPublish) {
    approvalStatus = 'publicado';
  } else if (body.requestedStatus === 'en_revision' || (body.requestedStatus === 'publicado' && !canPublish)) {
    approvalStatus = 'en_revision';
  }

  const now = new Date().toISOString();
  const article: CmjArticle = {
    id: `art_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
    kind: body.kind === 'comunicado_oficial' ? 'comunicado_oficial' : 'opinion_articulo',
    category: sanitizeText(body.category, 80) || 'Institucional',
    summary: sanitizeText(body.summary, 500) || sanitizeText(content, 240),
    content,
    coverImageUrl: body.coverImageUrl ? sanitizeText(body.coverImageUrl, 500) : undefined,
    authorId: user.id,
    authorName: user.fullName,
    authorCargo: user.cargoTitle,
    approvalStatus,
    scheduledAt: body.scheduledAt ? sanitizeText(body.scheduledAt, 40) : undefined,
    publishedAt: approvalStatus === 'publicado' ? now : undefined,
    approvedBy: approvalStatus === 'publicado' ? user.fullName : undefined,
    versions: [
      {
        version: 1,
        title,
        summary: sanitizeText(body.summary, 500),
        content,
        editedBy: user.fullName,
        editedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  store.articles.unshift(article);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_noticia',
    'noticias',
    `Publicación creada: "${article.title}" (${article.approvalStatus}).`,
    article.id,
    getClientIp(req)
  );
  res.json({ ok: true, article });
});

app.put('/api/cmj/articles/:id', requirePermission('noticias', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const art = store.articles.find((a) => a.id === req.params.id);
  if (!art) return res.status(404).json({ error: 'Publicación no encontrada.' });

  const body = req.body || {};
  const newTitle = body.title !== undefined ? sanitizeText(body.title, 220) : art.title;
  const newSummary = body.summary !== undefined ? sanitizeText(body.summary, 500) : art.summary;
  const newContent = body.content !== undefined ? sanitizeRichText(body.content, 30000) : art.content;
  const now = new Date().toISOString();

  if (newTitle !== art.title || newContent !== art.content) {
    art.versions.push({
      version: art.versions.length + 1,
      title: newTitle,
      summary: newSummary,
      content: newContent,
      editedBy: user.fullName,
      editedAt: now,
    });
  }

  art.title = newTitle;
  art.summary = newSummary;
  art.content = newContent;
  if (body.kind) art.kind = body.kind === 'comunicado_oficial' ? 'comunicado_oficial' : 'opinion_articulo';
  if (body.category !== undefined) art.category = sanitizeText(body.category, 80);
  if (body.coverImageUrl !== undefined) art.coverImageUrl = sanitizeText(body.coverImageUrl, 500);
  if (body.scheduledAt !== undefined) art.scheduledAt = sanitizeText(body.scheduledAt, 40);

  if (body.approvalStatus) {
    if (body.approvalStatus === 'publicado' || body.approvalStatus === 'aprobado') {
      if (!hasPermission(user, 'noticias', 'publicar') && !hasPermission(user, 'noticias', 'aprobar')) {
        return res.status(403).json({ error: 'No tienes permiso para aprobar o publicar directamente.' });
      }
      art.approvalStatus = body.approvalStatus;
      art.approvedBy = user.fullName;
      if (body.approvalStatus === 'publicado' && !art.publishedAt) {
        art.publishedAt = now;
      }
    } else {
      art.approvalStatus = body.approvalStatus;
    }
  }

  art.updatedAt = now;
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'editar_noticia',
    'noticias',
    `Publicación actualizada: "${art.title}" (${art.approvalStatus}).`,
    art.id,
    getClientIp(req)
  );
  res.json({ ok: true, article: art });
});

app.delete('/api/cmj/articles/:id', requirePermission('noticias', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.articles = store.articles.filter((a) => a.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_noticia',
    'noticias',
    `Publicación eliminada (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- ACTIVITIES --- */
app.post('/api/cmj/activities', requirePermission('actividades', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 200);
  if (!title || !body.date) {
    return res.status(400).json({ error: 'Título y fecha de la actividad son obligatorios.' });
  }
  const canPublish = hasPermission(user, 'actividades', 'publicar');
  const now = new Date().toISOString();
  const activity: CmjActivity = {
    id: `act_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    description: sanitizeText(body.description, 2000),
    date: sanitizeText(body.date, 30),
    time: body.time ? sanitizeText(body.time, 20) : undefined,
    location: sanitizeText(body.location, 200) || 'Flandes, Tolima',
    commissionId: body.commissionId ? sanitizeText(body.commissionId, 80) : undefined,
    commissionName: body.commissionName ? sanitizeText(body.commissionName, 120) : undefined,
    responsibleNames: Array.isArray(body.responsibleNames) ? body.responsibleNames : [user.fullName],
    objectives: Array.isArray(body.objectives)
      ? body.objectives.map((o: unknown) => sanitizeText(o, 300)).filter(Boolean)
      : [],
    results: body.results ? sanitizeText(body.results, 1500) : undefined,
    photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
    approvalStatus: canPublish && body.publishNow !== false ? 'publicado' : 'en_revision',
    createdBy: user.fullName,
    createdAt: now,
    updatedAt: now,
  };
  store.activities.unshift(activity);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_actividad',
    'actividades',
    `Actividad registrada: ${activity.title}.`,
    activity.id,
    getClientIp(req)
  );
  res.json({ ok: true, activity });
});

app.delete('/api/cmj/activities/:id', requirePermission('actividades', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.activities = store.activities.filter((a) => a.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_actividad',
    'actividades',
    `Actividad eliminada (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- POLLS & OFFICIAL VOTES --- */
app.post('/api/cmj/polls', requirePermission('encuestas', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 200);
  const rawOptions = Array.isArray(body.options) ? body.options : [];
  if (!title || rawOptions.length < 2) {
    return res.status(400).json({ error: 'Título y al menos 2 opciones son obligatorios.' });
  }
  const now = new Date().toISOString();
  const poll: CmjPoll = {
    id: `poll_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    description: sanitizeText(body.description, 1000),
    pollKind: body.pollKind === 'votacion_oficial' ? 'votacion_oficial' : 'encuesta_opinion',
    options: rawOptions.map((opt: any, idx: number) => ({
      id: `opt_${idx + 1}_${crypto.randomBytes(2).toString('hex')}`,
      text: sanitizeText(typeof opt === 'string' ? opt : opt?.text, 200),
      imageUrl: opt?.imageUrl ? sanitizeText(opt.imageUrl, 500) : undefined,
      votes: 0,
    })),
    opensAt: sanitizeText(body.opensAt, 40) || now,
    closesAt: sanitizeText(body.closesAt, 40) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: body.isActive !== false,
    allowMultiple: Boolean(body.allowMultiple),
    totalVotes: 0,
    voterFingerprints: [],
    createdBy: user.fullName,
    createdAt: now,
    updatedAt: now,
  };
  store.polls.unshift(poll);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_encuesta',
    'encuestas',
    `Encuesta/votación creada: ${poll.title} (${poll.pollKind}).`,
    poll.id,
    getClientIp(req)
  );
  res.json({ ok: true, poll });
});

app.post('/api/cmj/polls/:id/vote', (req, res) => {
  const ip = getClientIp(req);
  const poll = store.polls.find((p) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Encuesta no encontrada.' });
  if (!poll.isActive) return res.status(400).json({ error: 'Esta encuesta se encuentra cerrada.' });

  const now = Date.now();
  if (poll.closesAt && new Date(poll.closesAt).getTime() < now) {
    return res.status(400).json({ error: 'El plazo de votación ha finalizado.' });
  }

  const { optionId, voterKey } = req.body || {};
  const opt = poll.options.find((o) => o.id === optionId);
  if (!opt) return res.status(400).json({ error: 'Opción de voto inválida.' });

  const fingerprint = crypto
    .createHash('sha256')
    .update(`${poll.id}::${ip}::${sanitizeText(voterKey || 'anon', 100)}`)
    .digest('hex');

  if (poll.voterFingerprints.includes(fingerprint)) {
    return res.status(409).json({
      error: 'Ya registraste tu voto en esta consulta. No se permiten votos duplicados.',
    });
  }

  opt.votes += 1;
  poll.totalVotes += 1;
  poll.voterFingerprints.push(fingerprint);
  poll.updatedAt = new Date().toISOString();
  saveStore(store);

  res.json({ ok: true, poll });
});

app.delete('/api/cmj/polls/:id', requirePermission('encuestas', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.polls = store.polls.filter((p) => p.id !== req.params.id);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_encuesta',
    'encuestas',
    `Encuesta eliminada (${req.params.id}).`,
    req.params.id,
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- MEDIA GALLERY --- */
app.post('/api/cmj/media', requirePermission('galeria', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  const title = sanitizeText(body.title, 180);
  const url = sanitizeText(body.url, 500);
  if (!title || !url) {
    return res.status(400).json({ error: 'Título y archivo multimedia son obligatorios.' });
  }
  const canPublish = hasPermission(user, 'galeria', 'publicar');
  const now = new Date().toISOString();
  const item: CmjMediaItem = {
    id: `media_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    title,
    description: body.description ? sanitizeText(body.description, 500) : undefined,
    mediaType: body.mediaType === 'video' ? 'video' : 'image',
    url,
    category: ['sesiones', 'actividades', 'proyectos', 'eventos', 'reuniones', 'jornadas_juveniles'].includes(
      body.category
    )
      ? body.category
      : 'actividades',
    eventDate: sanitizeText(body.eventDate, 30) || now.slice(0, 10),
    uploadedBy: user.fullName,
    approvalStatus: canPublish ? 'publicado' : 'en_revision',
    createdAt: now,
  };
  store.media.unshift(item);
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'subir_multimedia',
    'galeria',
    `Elemento multimedia agregado: ${item.title}.`,
    item.id,
    getClientIp(req)
  );
  res.json({ ok: true, mediaItem: item });
});

app.delete('/api/cmj/media/:id', requirePermission('galeria', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  store.media = store.media.filter((m) => m.id !== req.params.id);
  saveStore(store);
  res.json({ ok: true });
});

/* --- YOUTH PARTICIPATION PROPOSALS (PUBLIC SUBMISSION + TRACKING + ADMIN RESPONSE) --- */
app.post('/api/cmj/proposals', (req, res) => {
  const ip = getClientIp(req);
  const body = req.body || {};
  if (body.honeypot && String(body.honeypot).trim().length > 0) {
    return res.status(403).json({ error: 'Solicitud bloqueada.' });
  }
  const authorName = sanitizeText(body.authorName, 120);
  const authorEmail = sanitizeText(body.authorEmail, 150);
  const title = sanitizeText(body.title, 200);
  const description = sanitizeText(body.description, 3000);

  if (!authorName || !authorEmail || !title || !description) {
    return res.status(400).json({ error: 'Completa todos los campos obligatorios de tu propuesta.' });
  }

  const now = new Date().toISOString();
  const trackingCode = `CMJ-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const proposal: CmjProposal = {
    id: `prop_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    trackingCode,
    authorName,
    authorEmail,
    authorPhone: body.authorPhone ? sanitizeText(body.authorPhone, 40) : undefined,
    authorAge: body.authorAge ? Number(body.authorAge) : undefined,
    neighborhood: body.neighborhood ? sanitizeText(body.neighborhood, 120) : undefined,
    topic: sanitizeText(body.topic, 100) || 'Participación Juvenil',
    title,
    description,
    status: 'recibida',
    createdAt: now,
    updatedAt: now,
  };

  store.proposals.unshift(proposal);
  saveStore(store);

  recordAudit(
    { id: 'ciudadano', name: authorName, role: 'ciudadano' },
    'enviar_propuesta',
    'participacion',
    `Propuesta ciudadana radicada (${trackingCode}): ${title}.`,
    proposal.id,
    ip
  );

  res.json({ ok: true, trackingCode, proposal });
});

app.get('/api/cmj/proposals/track/:code', (req, res) => {
  const code = sanitizeText(req.params.code, 40).toUpperCase();
  const found = store.proposals.find((p) => p.trackingCode.toUpperCase() === code);
  if (!found) {
    return res.status(404).json({ error: 'No se encontró ninguna propuesta con ese código de radicado.' });
  }
  res.json({
    trackingCode: found.trackingCode,
    title: found.title,
    topic: found.topic,
    status: found.status,
    institutionalResponse: found.institutionalResponse,
    respondedBy: found.respondedBy,
    respondedAt: found.respondedAt,
    createdAt: found.createdAt,
  });
});

app.put('/api/cmj/proposals/:id', requirePermission('participacion', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const prop = store.proposals.find((p) => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Propuesta no encontrada.' });
  const { status, institutionalResponse } = req.body || {};
  if (status && ['recibida', 'en_revision', 'aceptada', 'respondida'].includes(status)) {
    prop.status = status;
  }
  if (institutionalResponse !== undefined) {
    prop.institutionalResponse = sanitizeText(institutionalResponse, 2000);
    prop.respondedBy = user.fullName;
    prop.respondedAt = new Date().toISOString();
  }
  prop.updatedAt = new Date().toISOString();
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'responder_propuesta',
    'participacion',
    `Propuesta ${prop.trackingCode} actualizada a estado: ${prop.status}.`,
    prop.id,
    getClientIp(req)
  );
  res.json({ ok: true, proposal: prop });
});

/* --- PUBLIC CONTACT FORM --- */
app.post('/api/cmj/contact', (req, res) => {
  const ip = getClientIp(req);
  const body = req.body || {};
  if (body.honeypot && String(body.honeypot).trim().length > 0) {
    return res.status(403).json({ error: 'Solicitud bloqueada.' });
  }
  const senderName = sanitizeText(body.senderName, 120);
  const senderEmail = sanitizeText(body.senderEmail, 150);
  const subject = sanitizeText(body.subject, 200);
  const message = sanitizeText(body.message, 3000);

  if (!senderName || !senderEmail || !subject || !message) {
    return res.status(400).json({ error: 'Todos los campos del formulario de contacto son obligatorios.' });
  }

  const msg: CmjContactMessage = {
    id: `msg_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    senderName,
    senderEmail,
    senderPhone: body.senderPhone ? sanitizeText(body.senderPhone, 40) : undefined,
    subject,
    message,
    status: 'nuevo',
    createdAt: new Date().toISOString(),
  };

  store.contactMessages.unshift(msg);
  saveStore(store);
  recordAudit(
    { id: 'ciudadano', name: senderName, role: 'ciudadano' },
    'mensaje_contacto',
    'contacto',
    `Mensaje institucional recibido: ${subject}.`,
    msg.id,
    ip
  );
  res.json({ ok: true, id: msg.id });
});

/* --- FULL BACKUP & RESTORE (PRINCIPAL ADMIN ONLY) --- */
app.get('/api/cmj/admin/backup', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  if (user.role !== 'admin_principal') {
    return res.status(403).json({ error: 'Solo el Administrador Principal puede exportar respaldos.' });
  }
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'exportar_respaldo',
    'backup',
    'Respaldo completo de la base de datos institucional exportado.',
    'backup',
    getClientIp(req)
  );
  res.json({
    exportedAt: new Date().toISOString(),
    platform: 'Consejo Municipal de Juventud Flandes',
    data: store,
  });
});

app.post('/api/cmj/admin/restore', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  if (user.role !== 'admin_principal') {
    return res.status(403).json({ error: 'Solo el Administrador Principal puede restaurar respaldos.' });
  }
  const backupData = req.body?.data;
  if (!backupData || !Array.isArray(backupData.members) || !backupData.config) {
    return res.status(400).json({ error: 'Archivo de respaldo inválido o corrupto.' });
  }
  // Ensure principal admin is preserved
  const hasPrincipal = backupData.members.some((m: any) => m.role === 'admin_principal');
  if (!hasPrincipal) {
    return res.status(400).json({ error: 'El respaldo debe conservar la cuenta del Administrador Principal.' });
  }
  store = backupData;
  saveStore(store);
  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'restaurar_respaldo',
    'backup',
    'Base de datos institucional restaurada desde respaldo.',
    'restore',
    getClientIp(req)
  );
  res.json({ ok: true });
});

/* --- COMMITMENTS / COMPROMISOS --- */
app.post('/api/cmj/commitments', requirePermission('compromisos', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  if (!body.title || !body.responsibleName) {
    return res.status(400).json({ error: 'Título y responsable son obligatorios.' });
  }

  const commitment: CmjCommitment = {
    id: `com_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: sanitizeText(body.title, 180),
    description: sanitizeText(body.description, 1000),
    sessionId: body.sessionId ? sanitizeText(body.sessionId, 80) : undefined,
    sessionTitle: body.sessionTitle ? sanitizeText(body.sessionTitle, 180) : undefined,
    responsibleId: body.responsibleId ? sanitizeText(body.responsibleId, 80) : user.id,
    responsibleName: sanitizeText(body.responsibleName, 120),
    assignedDate: body.assignedDate || new Date().toISOString().slice(0, 10),
    deadline: body.deadline || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    status: ['pendiente', 'en_proceso', 'en_revision', 'cumplido', 'vencido', 'cancelado'].includes(body.status)
      ? body.status
      : 'pendiente',
    evidences: Array.isArray(body.evidences) ? body.evidences.map((e: any) => sanitizeText(e, 500)) : [],
    notes: body.notes ? sanitizeText(body.notes, 500) : undefined,
    createdBy: user.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.commitments.unshift(commitment);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_compromiso',
    'compromisos',
    `Compromiso asignado a ${commitment.responsibleName}: ${commitment.title}`,
    commitment.id,
    getClientIp(req)
  );

  res.json({ ok: true, commitment });
});

app.put('/api/cmj/commitments/:id', requirePermission('compromisos', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const target = store.commitments.find((c) => c.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Compromiso no encontrado.' });

  const body = req.body || {};
  if (body.title) target.title = sanitizeText(body.title, 180);
  if (body.description) target.description = sanitizeText(body.description, 1000);
  if (body.status && ['pendiente', 'en_proceso', 'en_revision', 'cumplido', 'vencido', 'cancelado'].includes(body.status)) {
    target.status = body.status;
    if (body.status === 'cumplido' && !target.completedDate) {
      target.completedDate = new Date().toISOString().slice(0, 10);
    }
  }
  if (body.deadline) target.deadline = body.deadline;
  if (body.notes !== undefined) target.notes = sanitizeText(body.notes, 500);
  if (Array.isArray(body.evidences)) {
    target.evidences = body.evidences.map((e: any) => sanitizeText(e, 500));
  }
  target.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'actualizar_compromiso',
    'compromisos',
    `Compromiso actualizado: ${target.title} (Estado: ${target.status})`,
    target.id,
    getClientIp(req)
  );

  res.json({ ok: true, commitment: target });
});

app.delete('/api/cmj/commitments/:id', requirePermission('compromisos', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const idx = store.commitments.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Compromiso no encontrado.' });

  const deleted = store.commitments.splice(idx, 1)[0];
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_compromiso',
    'compromisos',
    `Compromiso eliminado: ${deleted.title}`,
    deleted.id,
    getClientIp(req)
  );

  res.json({ ok: true });
});

/* --- INTERNAL NOTIFICATIONS / COMUNICACIÓN INTERNA --- */
app.post('/api/cmj/notifications', requirePermission('comunicacion', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  if (!body.title || !body.message) {
    return res.status(400).json({ error: 'Título y mensaje son obligatorios.' });
  }

  const notification: CmjInternalNotification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: sanitizeText(body.title, 180),
    message: sanitizeText(body.message, 2000),
    senderId: user.id,
    senderName: user.fullName,
    senderCargo: user.cargoTitle,
    category: ['aviso', 'comunicado', 'convocatoria', 'tarea', 'proyecto'].includes(body.category)
      ? body.category
      : 'aviso',
    priority: ['normal', 'alta', 'urgente'].includes(body.priority) ? body.priority : 'normal',
    targetMemberIds: Array.isArray(body.targetMemberIds) ? body.targetMemberIds : [],
    readByMemberIds: [user.id],
    createdAt: new Date().toISOString(),
  };

  store.internalNotifications.unshift(notification);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'enviar_comunicado',
    'comunicacion',
    `Comunicado emitido: ${notification.title}`,
    notification.id,
    getClientIp(req)
  );

  res.json({ ok: true, notification });
});

app.post('/api/cmj/notifications/:id/read', requireAuth, (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const target = store.internalNotifications.find((n) => n.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Notificación no encontrada.' });

  if (!target.readByMemberIds.includes(user.id)) {
    target.readByMemberIds.push(user.id);
    saveStore(store);
  }
  res.json({ ok: true });
});

/* --- VEEDURÍA Y CONTROL SOCIAL --- */
app.post('/api/cmj/veeduria', requirePermission('veeduria', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  if (!body.title || !body.targetEntity || !body.issueDescription) {
    return res.status(400).json({ error: 'Título, entidad y descripción son obligatorios.' });
  }

  const veeduriaCase: CmjVeeduriaCase = {
    id: `veed_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: sanitizeText(body.title, 180),
    issueDescription: sanitizeText(body.issueDescription, 2000),
    targetEntity: sanitizeText(body.targetEntity, 140),
    filedRadicadoNumber: body.filedRadicadoNumber ? sanitizeText(body.filedRadicadoNumber, 80) : undefined,
    filingDate: body.filingDate || new Date().toISOString().slice(0, 10),
    expectedResponseDate: body.expectedResponseDate ? sanitizeText(body.expectedResponseDate, 20) : undefined,
    officialResponse: body.officialResponse ? sanitizeText(body.officialResponse, 2000) : undefined,
    responseDate: body.responseDate ? sanitizeText(body.responseDate, 20) : undefined,
    commitmentsGiven: body.commitmentsGiven ? sanitizeText(body.commitmentsGiven, 1000) : undefined,
    status: ['radicado', 'en_espera', 'respondido', 'compromiso_pactado', 'seguimiento_cerrado'].includes(body.status)
      ? body.status
      : 'radicado',
    evidenceUrls: Array.isArray(body.evidenceUrls) ? body.evidenceUrls.map((e: any) => sanitizeText(e, 500)) : [],
    responsibleMemberName: user.fullName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.veeduriaCases.unshift(veeduriaCase);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_veeduria',
    'veeduria',
    `Caso de veeduría radicado ante ${veeduriaCase.targetEntity}: ${veeduriaCase.title}`,
    veeduriaCase.id,
    getClientIp(req)
  );

  res.json({ ok: true, veeduriaCase });
});

app.put('/api/cmj/veeduria/:id', requirePermission('veeduria', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const target = store.veeduriaCases.find((v) => v.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Caso de veeduría no encontrado.' });

  const body = req.body || {};
  if (body.title) target.title = sanitizeText(body.title, 180);
  if (body.issueDescription) target.issueDescription = sanitizeText(body.issueDescription, 2000);
  if (body.targetEntity) target.targetEntity = sanitizeText(body.targetEntity, 140);
  if (body.filedRadicadoNumber !== undefined) target.filedRadicadoNumber = sanitizeText(body.filedRadicadoNumber, 80);
  if (body.expectedResponseDate) target.expectedResponseDate = sanitizeText(body.expectedResponseDate, 20);
  if (body.officialResponse !== undefined) target.officialResponse = sanitizeText(body.officialResponse, 2000);
  if (body.responseDate) target.responseDate = sanitizeText(body.responseDate, 20);
  if (body.commitmentsGiven !== undefined) target.commitmentsGiven = sanitizeText(body.commitmentsGiven, 1000);
  if (body.status && ['radicado', 'en_espera', 'respondido', 'compromiso_pactado', 'seguimiento_cerrado'].includes(body.status)) {
    target.status = body.status;
  }
  if (Array.isArray(body.evidenceUrls)) {
    target.evidenceUrls = body.evidenceUrls.map((u: any) => sanitizeText(u, 500));
  }
  target.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'actualizar_veeduria',
    'veeduria',
    `Caso de veeduría actualizado: ${target.title} (${target.status})`,
    target.id,
    getClientIp(req)
  );

  res.json({ ok: true, veeduriaCase: target });
});

app.delete('/api/cmj/veeduria/:id', requirePermission('veeduria', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const idx = store.veeduriaCases.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Caso de veeduría no encontrado.' });

  const deleted = store.veeduriaCases.splice(idx, 1)[0];
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_veeduria',
    'veeduria',
    `Caso de veeduría eliminado: ${deleted.title}`,
    deleted.id,
    getClientIp(req)
  );

  res.json({ ok: true });
});

/* --- WORK PLANS / PLAN DE TRABAJO --- */
app.post('/api/cmj/work-plans', requirePermission('plan_trabajo', 'crear'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  if (!body.title || !body.strategicAxis) {
    return res.status(400).json({ error: 'Título y eje estratégico son obligatorios.' });
  }

  const workPlan: CmjWorkPlan = {
    id: `plan_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: sanitizeText(body.title, 180),
    strategicAxis: sanitizeText(body.strategicAxis, 140),
    objectives: Array.isArray(body.objectives) ? body.objectives.map((o: any) => sanitizeText(o, 250)) : [],
    activities: Array.isArray(body.activities)
      ? body.activities.map((a: any) => ({
          id: a.id || `act_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
          name: sanitizeText(a.name, 180),
          responsible: sanitizeText(a.responsible, 120),
          targetDate: a.targetDate || new Date().toISOString().slice(0, 10),
          progress: Number(a.progress) || 0,
          status: ['planeada', 'en_curso', 'completada'].includes(a.status) ? a.status : 'planeada',
        }))
      : [],
    commissionId: body.commissionId ? sanitizeText(body.commissionId, 80) : undefined,
    commissionName: body.commissionName ? sanitizeText(body.commissionName, 120) : undefined,
    year: Number(body.year) || new Date().getFullYear(),
    status: ['activo', 'en_revision', 'cerrado'].includes(body.status) ? body.status : 'activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.workPlans.unshift(workPlan);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_plan_trabajo',
    'plan_trabajo',
    `Plan de trabajo creado: ${workPlan.title}`,
    workPlan.id,
    getClientIp(req)
  );

  res.json({ ok: true, workPlan });
});

app.put('/api/cmj/work-plans/:id', requirePermission('plan_trabajo', 'editar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const target = store.workPlans.find((w) => w.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Plan de trabajo no encontrado.' });

  const body = req.body || {};
  if (body.title) target.title = sanitizeText(body.title, 180);
  if (body.strategicAxis) target.strategicAxis = sanitizeText(body.strategicAxis, 140);
  if (Array.isArray(body.objectives)) target.objectives = body.objectives.map((o: any) => sanitizeText(o, 250));
  if (Array.isArray(body.activities)) {
    target.activities = body.activities.map((a: any) => ({
      id: a.id || `act_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      name: sanitizeText(a.name, 180),
      responsible: sanitizeText(a.responsible, 120),
      targetDate: a.targetDate || new Date().toISOString().slice(0, 10),
      progress: Math.min(100, Math.max(0, Number(a.progress) || 0)),
      status: ['planeada', 'en_curso', 'completada'].includes(a.status) ? a.status : 'planeada',
    }));
  }
  if (body.status && ['activo', 'en_revision', 'cerrado'].includes(body.status)) target.status = body.status;
  target.updatedAt = new Date().toISOString();
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'actualizar_plan_trabajo',
    'plan_trabajo',
    `Plan de trabajo actualizado: ${target.title}`,
    target.id,
    getClientIp(req)
  );

  res.json({ ok: true, workPlan: target });
});

app.delete('/api/cmj/work-plans/:id', requirePermission('plan_trabajo', 'eliminar'), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const idx = store.workPlans.findIndex((w) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plan de trabajo no encontrado.' });

  const deleted = store.workPlans.splice(idx, 1)[0];
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_plan_trabajo',
    'plan_trabajo',
    `Plan de trabajo eliminado: ${deleted.title}`,
    deleted.id,
    getClientIp(req)
  );

  res.json({ ok: true });
});

/* --- KNOWLEDGE & TRAINING / FORMACIÓN --- */
app.post('/api/cmj/knowledge', requireRole(['admin_principal', 'presidente', 'secretario']), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const body = req.body || {};
  if (!body.title || !body.description) {
    return res.status(400).json({ error: 'Título y descripción son obligatorios.' });
  }

  const knowledgeItem: CmjKnowledgeItem = {
    id: `know_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    title: sanitizeText(body.title, 180),
    category: body.category || 'estatuto_1622_1885',
    description: sanitizeText(body.description, 1000),
    lawReference: body.lawReference ? sanitizeText(body.lawReference, 150) : undefined,
    isOfficialDocument: Boolean(body.isOfficialDocument),
    fileUrl: body.fileUrl ? sanitizeText(body.fileUrl, 500) : undefined,
    externalLink: body.externalLink ? sanitizeText(body.externalLink, 500) : undefined,
    contentText: body.contentText ? sanitizeRichText(body.contentText, 15000) : undefined,
    publishedAt: new Date().toISOString().slice(0, 10),
  };

  store.knowledgeItems.unshift(knowledgeItem);
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'crear_material_formacion',
    'formacion',
    `Recurso pedagógico o normativo cargado: ${knowledgeItem.title}`,
    knowledgeItem.id,
    getClientIp(req)
  );

  res.json({ ok: true, knowledgeItem });
});

app.delete('/api/cmj/knowledge/:id', requireRole(['admin_principal', 'presidente', 'secretario']), (req, res) => {
  const user: StoredMemberRecord = (req as any).cmjUser;
  const idx = store.knowledgeItems.findIndex((k) => k.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Material de formación no encontrado.' });

  const deleted = store.knowledgeItems.splice(idx, 1)[0];
  saveStore(store);

  recordAudit(
    { id: user.id, name: user.fullName, role: user.role },
    'eliminar_material_formacion',
    'formacion',
    `Material de formación eliminado: ${deleted.title}`,
    deleted.id,
    getClientIp(req)
  );

  res.json({ ok: true });
});

/* =========================================================================
   8. VITE DEV MIDDLEWARE / STATIC DIST SERVING
   ========================================================================= */
export { app };
export default app;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Consejo Municipal de Juventud Flandes running on http://0.0.0.0:${PORT}`);
  });
}

// Only listen automatically when running standalone, not when imported as Vercel serverless function
if (!process.env.VERCEL) {
  startServer();
}
