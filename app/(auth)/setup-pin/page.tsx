'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PinInput } from '@/components/shared/pin-input'
import { Button } from '@/components/ui/button'
import { hashPin, unlockSession, lockSession } from '@/lib/hooks/use-pin'
import { createClient } from '@/lib/supabase/client'
import { Lock, ShieldCheck, Loader2 } from 'lucide-react'

export default function SetupPinPage() {
  const router = useRouter()
  const [step, setStep] = useState<'set' | 'confirm'>('set')
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
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

      // Clear session lama (biar gak nyangkut)
      lockSession()

      // Kalau udah punya PIN di DB → ke /unlock
      const { data: settings } = await supabase
        .from('user_settings')
        .select('pin_hash')
        .eq('user_id', user.id)
        .single()

      if (settings?.pin_hash) {
        router.replace('/unlock')
        return
      }

      setChecking(false)
    }
    check()
  }, [router])

  const handleSetComplete = (value: string) => {
    setTimeout(() => {
      setStep('confirm')
      setError(false)
    }, 200)
  }

  const handleConfirmComplete = async (value: string) => {
    if (value !== pin) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setConfirmPin('')
      }, 500)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const pinHash = await hashPin(value)

      const { error: updateError } = await supabase
        .from('user_settings')
        .update({ pin_hash: pinHash })
        .eq('user_id', user.id)

      if (updateError) {
        toast.error('Gagal menyimpan PIN')
        setLoading(false)
        return
      }

      unlockSession()
      toast.success('PIN berhasil dibuat!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error('Terjadi kesalahan')
      setLoading(false)
    }
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
            {step === 'set' ? (
              <Lock className="w-8 h-8 text-primary-500" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-primary-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {step === 'set' ? 'Buat PIN' : 'Konfirmasi PIN'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'set'
              ? 'PIN 6 digit buat unlock app dengan cepat.'
              : 'Masukkan PIN sekali lagi untuk konfirmasi.'}
          </p>
        </div>

        <div className="space-y-6">
          {step === 'set' ? (
            <PinInput
              value={pin}
              onChange={setPinValue}
              onComplete={handleSetComplete}
              autoFocus
            />
          ) : (
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              onComplete={handleConfirmComplete}
              autoFocus
              error={error}
              disabled={loading}
            />
          )}

          {error && (
            <p className="text-center text-sm text-red-500">
              PIN tidak sama. Coba lagi.
            </p>
          )}

          {step === 'confirm' && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStep('set')
                setPinValue('')
                setConfirmPin('')
                setError(false)
              }}
              disabled={loading}
            >
              Kembali
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          PIN disimpan dengan aman di server. Cuma lu yang tau.
        </p>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
          Synmony v0.1.0
        </p>
      </div>
    </div>
  )
}