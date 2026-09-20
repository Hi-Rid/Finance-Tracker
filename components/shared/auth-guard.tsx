'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { hasPin, isUnlocked } from '@/lib/hooks/use-pin'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Kalau belum punya PIN → setup
    if (!hasPin()) {
      router.replace('/setup-pin')
      return
    }

    // Kalau udah punya PIN tapi belum unlock → unlock
    if (!isUnlocked()) {
      router.replace('/unlock')
      return
    }
  }, [router, pathname])

  return <>{children}</>
}