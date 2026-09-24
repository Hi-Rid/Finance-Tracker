'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PinInput } from '@/components/shared/pin-input'
import { Button } from '@/components/ui/button'
import {
  verifyPinHash,
  unlockSession,
  isSessionUnlocked,
  lockSession,
} from '@/lib/hooks/use-pin'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2 } from 'lucide-react'

export default function UnlockPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      // Cek PIN dulu
      const { data: settings } = await supabase
        .from('user_settings')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single()

      // Kalau belum punya PIN → /setup-pin (prioritas)
      if (!settings?.pin_hash) {
        router.replace('/setup-pin')
        return
      }

      // Baru cek session
      if (isSessionUnlocked()) {
        router.replace('/dashboard')
        return
      }

      setChecking(false)
    }
    check()
  }, [router])

  const handleComplete = async (value: string) => {
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login')
      return
    }

    const { data: settings } = await supabase
      .from('user_settings')
      .select('pin_hash')
      .eq('user_id', user.id)
      .single()

    if (!settings?.pin_hash) {
      router.replace('/setup-pin')
      return
    }

    const ok = await verifyPinHash(value, settings.pin_hash)

    if (!ok) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setPin('')
        setLoading(false)
      }, 500)
      return
    }

    unlockSession()
    router.push('/dashboard')
    router.refresh()
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    lockSession()
    toast.success('Logged out')
    router.push('/login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-100/10 items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Masukkan PIN</h1>
          <p className="text-sm text-muted-foreground">
            Unlock buat masuk ke dashboard.
          </p>
        </div>

        <div className="space-y-6">
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleComplete}
            error={error}
            disabled={loading}
            autoFocus
          />

          {error && (
            <p className="text-center text-sm text-red-500">
              PIN salah. Coba lagi.
            </p>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-6">
          Synmony v0.1.0
        </p>
      </div>
    </div>
  )
}