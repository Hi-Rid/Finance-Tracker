'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PinInput } from '@/components/shared/pin-input'
import { Button } from '@/components/ui/button'
import { verifyPin, hasPin, clearPin } from '@/lib/hooks/use-pin'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'

export default function UnlockPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Kalau gak punya PIN, redirect ke setup
    if (!hasPin()) {
      router.push('/setup-pin')
    }
  }, [router])

  const handleComplete = async (value: string) => {
    setLoading(true)
    const ok = await verifyPin(value)

    if (!ok) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setPin('')
        setLoading(false)
      }, 500)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearPin()
    toast.success('Logged out')
    router.push('/login')
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
      </div>
    </div>
  )
}