'use client'

const PIN_HASH_KEY = 'finance_pin_hash'
const PIN_UNLOCKED_KEY = 'finance_pin_unlocked'

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'finance_salt_v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin)
  localStorage.setItem(PIN_HASH_KEY, hash)
  sessionStorage.setItem(PIN_UNLOCKED_KEY, 'true')
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY)
  if (!stored) return false
  const hash = await hashPin(pin)
  if (hash === stored) {
    sessionStorage.setItem(PIN_UNLOCKED_KEY, 'true')
    return true
  }
  return false
}

export function hasPin(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PIN_HASH_KEY)
}

export function isUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(PIN_UNLOCKED_KEY) === 'true'
}

export function lock(): void {
  sessionStorage.removeItem(PIN_UNLOCKED_KEY)
}

export function clearPin(): void {
  localStorage.removeItem(PIN_HASH_KEY)
  sessionStorage.removeItem(PIN_UNLOCKED_KEY)
}