'use client'

const SESSION_KEY = 'synmony_unlocked'

/**
 * Hash PIN pakai SHA-256 + salt.
 * Simple, cukup buat app personal.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'synmony_salt_v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify PIN input dengan hash yang tersimpan.
 */
export async function verifyPinHash(
  pin: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPin(pin)
  return hash === storedHash
}

/**
 * Cek apakah session ini udah unlock (per-tab).
 */
export function isSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SESSION_KEY) === 'true'
}

/**
 * Tandai session ini sebagai unlocked.
 */
export function unlockSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, 'true')
}

/**
 * Clear session unlock flag (dipanggil saat logout/lock).
 */
export function lockSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}