'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { isSessionUnlocked } from '@/lib/hooks/use-pin'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isSessionUnlocked()) {
      router.replace('/unlock')
      return
    }
    setChecked(true)
  }, [router, pathname])

  // Jangan render children sampai auth check selesai
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    )
  }

  return <>{children}</>
}