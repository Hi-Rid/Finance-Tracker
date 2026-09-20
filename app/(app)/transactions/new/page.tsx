'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTransactionPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect ke /transactions dengan query ?new=1
    router.replace('/transactions?new=1')
  }, [router])

  return null
} 