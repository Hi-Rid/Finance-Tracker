'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validators/auth'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push('/unlock')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setError('✅ Akun dibuat. Coba login sekarang.')
      setMode('login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-500 mb-2">Finance</h1>
          <p className="text-muted-foreground text-sm">
            Everything about your money.
          </p>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-6">
            {mode === 'login' ? 'Masuk' : 'Daftar'}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                {...register('email')}
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition"
                placeholder="email@contoh.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <input
                type="password"
                {...register('password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full px-3 py-2.5 rounded-lg border bg-background focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Loading...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
            >
              {mode === 'login'
                ? 'Belum punya akun? Daftar'
                : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}