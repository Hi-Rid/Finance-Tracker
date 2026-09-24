'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isSessionUnlocked } from '@/lib/hooks/use-pin'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Kalau session belum unlock → ke /unlock
    if (!isSessionUnlocked()) {
      router.replace('/unlock')
      return
    }
  }, [router, pathname])

  return <>{children}</>
}