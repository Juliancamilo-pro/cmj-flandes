import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SecurityEvent,
  SecurityEventType,
  SecurityRiskLevel,
  UserSession,
  SystemBackup,
  ModerationLog
} from '../types';

export function getClientDeviceInfo(): { deviceLabel: string; browserLabel: string } {
  if (typeof navigator === 'undefined') {
    return { deviceLabel: 'Dispositivo Web', browserLabel: 'Navegador' };
  }
  const ua = navigator.userAgent || '';
  let deviceLabel = 'Computador de Escritorio';
  if (/android/i.test(ua)) deviceLabel = 'Teléfono / Tableta Android';
  else if (/iphone|ipad|ipod/i.test(ua)) deviceLabel = 'iPhone / iPad';
  else if (/macintosh/i.test(ua)) deviceLabel = 'Mac';
  else if (/windows/i.test(ua)) deviceLabel = 'PC Windows';
  else if (/linux/i.test(ua)) deviceLabel = 'Equipo Linux';

  let browserLabel = 'Navegador Web';
  if (/edg/i.test(ua)) browserLabel = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) browserLabel = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browserLabel = 'Mozilla Firefox';
  else if (/safari/i.test(ua)) browserLabel = 'Apple Safari';

  return { deviceLabel, browserLabel };
}

/**
 * Registra un evento en el Centro de Seguridad (servidor + Firestore)
 */
export async function logSecurityEvent(params: {
  eventType: SecurityEventType;
  riskLevel: SecurityRiskLevel;
  userEmail?: string;
  userRole?: string;
  description: string;
  endpoint?: string;
}): Promise<void> {
  const { deviceLabel } = getClientDeviceInfo();
  const payload = {
    ...params,
    deviceLabel,
    timestamp: new Date().toISOString()
  };

  try {
    await fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    await addDoc(collection(db, 'security_events'), payload).catch(() => {});
  } catch {
    // Non-blocking security telemetry
  }
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  const results: SecurityEvent[] = [];
  const seenIds = new Set<string>();

  try {
    const res = await fetch('/api/security/events');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.events)) {
        for (const ev of data.events) {
          results.push(ev);
          seenIds.add(ev.id);
        }
      }
    }
  } catch {}

  try {
    const q = query(collection(db, 'security_events'), orderBy('timestamp', 'desc'), limit(150));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      if (!seenIds.has(d.id)) {
        results.push({ id: d.id, ...(d.data() as Omit<SecurityEvent, 'id'>) });
      }
    });
  } catch {}

  return results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export async function registerActiveSession(
  userEmail: string,
  userRole: 'owner' | 'collaborator' | 'subscriber'
): Promise<string | null> {
  const { deviceLabel, browserLabel } = getClientDeviceInfo();
  const existingId = sessionStorage.getItem('dulima_session_id') || undefined;

  try {
    const res = await fetch('/api/security/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: existingId,
        userEmail,
        userRole,
        deviceLabel,
        browserLabel
      })
    });
    const data = await res.json();
    if (data?.revoked) {
      sessionStorage.removeItem('dulima_session_id');
      return null;
    }
    if (data?.session?.id) {
      sessionStorage.setItem('dulima_session_id', data.session.id);
      await setDoc(doc(db, 'user_sessions', data.session.id), data.session, { merge: true }).catch(
        () => {}
      );
      return data.session.id;
    }
  } catch {}
  return existingId || null;
}

export async function getActiveSessions(): Promise<UserSession[]> {
  const currentId = sessionStorage.getItem('dulima_session_id');
  const map = new Map<string, UserSession>();

  try {
    const res = await fetch('/api/security/sessions');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.sessions)) {
        for (const s of data.sessions) {
          map.set(s.id, { ...s, isCurrent: s.id === currentId });
        }
      }
    }
  } catch {}

  try {
    const snap = await getDocs(collection(db, 'user_sessions'));
    snap.forEach((d) => {
      const data = d.data() as UserSession;
      if (!data.revoked && new Date(data.expiresAt).getTime() > Date.now()) {
        if (!map.has(d.id)) {
          map.set(d.id, { ...data, id: d.id, isCurrent: d.id === currentId });
        }
      }
    });
  } catch {}

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  await fetch(`/api/security/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE'
  }).catch(() => {});
  await setDoc(
    doc(db, 'user_sessions', sessionId),
    { revoked: true, revokedAt: new Date().toISOString() },
    { merge: true }
  ).catch(() => {});
}

export async function revokeAllOtherSessions(): Promise<number> {
  const currentId = sessionStorage.getItem('dulima_session_id');
  let count = 0;
  try {
    const res = await fetch('/api/security/sessions/revoke-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exceptSessionId: currentId })
    });
    const data = await res.json();
    count = Number(data?.revokedCount || 0);
  } catch {}

  try {
    const snap = await getDocs(collection(db, 'user_sessions'));
    const now = new Date().toISOString();
    for (const d of snap.docs) {
      if (d.id !== currentId && !d.data().revoked) {
        await setDoc(doc(db, 'user_sessions', d.id), { revoked: true, revokedAt: now }, { merge: true });
      }
    }
  } catch {}

  return count;
}

/* =========================================================================
   COPIAS DE SEGURIDAD Y RECUPERACIÓN
   ========================================================================= */
const BACKUP_COLLECTIONS = [
  'profile',
  'settings',
  'categories',
  'articles',
  'posts',
  'comments',
  'collaborators',
  'subscription_plans',
  'subscribers_premium',
  'donations',
  'ad_proposals',
  'platform_updates',
  'citizen_polls',
  'editorial_events'
];

async function computeSha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createSystemBackup(
  label: string,
  type: 'manual' | 'programada',
  createdBy: string,
  notes?: string
): Promise<{ backup: SystemBackup; snapshotJson: string }> {
  const dataPayload: Record<string, any[]> = {};
  let totalRecords = 0;

  for (const colName of BACKUP_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      dataPayload[colName] = docs;
      totalRecords += docs.length;
    } catch {
      dataPayload[colName] = [];
    }
  }

  const snapshotObj = {
    platform: 'DULIMA',
    exportedAt: new Date().toISOString(),
    createdBy,
    collections: dataPayload
  };
  const snapshotJson = JSON.stringify(snapshotObj, null, 2);
  const checksumSha256 = await computeSha256Hex(snapshotJson);
  const sizeBytes = new Blob([snapshotJson]).size;

  const backupRecord: Omit<SystemBackup, 'id'> = {
    label: label.trim() || `Respaldo DULIMA ${new Date().toLocaleDateString('es-CO')}`,
    type,
    status: 'completada',
    collectionsIncluded: BACKUP_COLLECTIONS,
    totalRecords,
    sizeBytes,
    checksumSha256,
    createdBy,
    createdAt: new Date().toISOString(),
    notes
  };

  const ref = await addDoc(collection(db, 'system_backups'), backupRecord);
  await logSecurityEvent({
    eventType: 'actividad_admin',
    riskLevel: 'bajo',
    userEmail: createdBy,
    userRole: 'owner',
    description: `Copia de seguridad creada: "${backupRecord.label}" (${totalRecords} registros, SHA-256: ${checksumSha256.slice(0, 12)}...).`
  });

  return {
    backup: { id: ref.id, ...backupRecord },
    snapshotJson
  };
}

export async function getSystemBackups(): Promise<SystemBackup[]> {
  try {
    const q = query(collection(db, 'system_backups'), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SystemBackup, 'id'>) }));
  } catch {
    return [];
  }
}

export async function deleteSystemBackup(id: string): Promise<void> {
  await deleteDoc(doc(db, 'system_backups', id));
}

export async function restoreFromBackupJson(
  snapshotJson: string,
  restoredBy: string
): Promise<{ restoredCollections: number; restoredRecords: number }> {
  const parsed = JSON.parse(snapshotJson);
  if (!parsed || typeof parsed !== 'object' || !parsed.collections) {
    throw new Error('El archivo de respaldo no tiene una estructura válida de DULIMA.');
  }

  let restoredCollections = 0;
  let restoredRecords = 0;

  for (const [colName, docs] of Object.entries(parsed.collections)) {
    if (!BACKUP_COLLECTIONS.includes(colName) || !Array.isArray(docs)) continue;
    restoredCollections++;
    for (const item of docs) {
      if (item && typeof item === 'object' && item.id) {
        const { id, ...rest } = item;
        await setDoc(doc(db, colName, String(id)), rest, { merge: true });
        restoredRecords++;
      }
    }
  }

  await logSecurityEvent({
    eventType: 'actividad_admin',
    riskLevel: 'alto',
    userEmail: restoredBy,
    userRole: 'owner',
    description: `Restauración de copia de seguridad ejecutada (${restoredCollections} colecciones, ${restoredRecords} registros).`
  });

  return { restoredCollections, restoredRecords };
}

/* =========================================================================
   MODERACIÓN Y AUDITORÍA DE DECISIONES
   ========================================================================= */
export async function recordModerationDecision(
  entry: Omit<ModerationLog, 'id' | 'timestamp'>
): Promise<void> {
  await addDoc(collection(db, 'moderation_logs'), {
    ...entry,
    timestamp: new Date().toISOString()
  });
}

export async function getModerationLogs(): Promise<ModerationLog[]> {
  try {
    const q = query(collection(db, 'moderation_logs'), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ModerationLog, 'id'>) }));
  } catch {
    return [];
  }
}
