'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PinInput } from '@/components/shared/pin-input'
import { Button } from '@/components/ui/button'
import { setPin, hasPin } from '@/lib/hooks/use-pin'
import { Lock, ShieldCheck } from 'lucide-react'

export default function SetupPinPage() {
  const router = useRouter()
  const [step, setStep] = useState<'set' | 'confirm'>('set')
  const [pin, setPinValue] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Kalau udah punya PIN, redirect ke dashboard
    if (hasPin()) {
      router.push('/dashboard')
    }
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
      await setPin(value)
      toast.success('PIN berhasil dibuat!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast.error('Gagal menyimpan PIN')
      setLoading(false)
    }
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
            >
              Kembali
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          PIN cuma disimpan di browser ini. Gak dikirim ke server.
        </p>
      </div>
    </div>
  )
}