/**
 * Rate Limiter para prevenir ataques de fuerza bruta
 * Mantiene registro de intentos fallidos por usuario
 */

interface AttemptRecord {
  timestamp: number;
  failed: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos en milisegundos
const RESET_TIME = 24 * 60 * 60 * 1000; // 24 horas

// Almacenamiento en memoria (en producción usar Redis o base de datos)
const attemptMap = new Map<string, AttemptRecord>();

/**
 * Verifica si un usuario está bloqueado por exceso de intentos
 */
export const isUserLocked = (userId: string): boolean => {
  const record = attemptMap.get(userId);
  if (!record) return false;

  const now = Date.now();
  
  // Si pasó el tiempo de bloqueo, reiniciar contador
  if (now - record.timestamp > LOCKOUT_TIME) {
    attemptMap.delete(userId);
    return false;
  }

  // Usuario sigue bloqueado
  return record.failed >= MAX_ATTEMPTS;
};

/**
 * Registra un intento fallido y devuelve true si debe ser bloqueado
 */
export const recordFailedAttempt = (userId: string): boolean => {
  const record = attemptMap.get(userId);
  const now = Date.now();

  if (!record) {
    attemptMap.set(userId, { timestamp: now, failed: 1 });
    return false;
  }

  // Reiniciar si pasó el tiempo de reset
  if (now - record.timestamp > RESET_TIME) {
    attemptMap.set(userId, { timestamp: now, failed: 1 });
    return false;
  }

  // Incrementar intentos
  record.failed += 1;
  attemptMap.set(userId, record);

  return record.failed >= MAX_ATTEMPTS;
};

/**
 * Limpia los intentos fallidos tras un cambio de contraseña exitoso
 */
export const clearAttempts = (userId: string): void => {
  attemptMap.delete(userId);
};

/**
 * Devuelve información sobre los intentos de un usuario
 */
export const getAttemptInfo = (userId: string) => {
  const record = attemptMap.get(userId);
  if (!record) return null;

  const now = Date.now();
  const timeSinceFirst = now - record.timestamp;
  const isLocked = record.failed >= MAX_ATTEMPTS;
  const unlockTime = isLocked ? LOCKOUT_TIME - timeSinceFirst : 0;

  return {
    attempts: record.failed,
    isLocked,
    unlockTimeRemaining: Math.max(0, unlockTime),
    unlockTimeMinutes: Math.ceil(Math.max(0, unlockTime) / 60000)
  };
};
