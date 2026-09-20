"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type PinInputProps = {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  autoFocus?: boolean
  error?: boolean
  disabled?: boolean
}

export function PinInput({
  length = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  error = false,
  disabled = false,
}: PinInputProps) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => {
    if (autoFocus) {
      inputsRef.current[0]?.focus()
    }
  }, [autoFocus])

  React.useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return

    const newValue = value.split("")
    newValue[index] = digit.slice(-1)
    const joined = newValue.join("").slice(0, length)
    onChange(joined)

    // Auto-focus next
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-card transition-all outline-none",
            "focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30",
            error
              ? "border-red-500 animate-shake"
              : "border-input",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  )
}