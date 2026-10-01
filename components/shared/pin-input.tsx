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

  const handleChange = (index: number, input: string) => {
    if (!/^\d*$/.test(input)) return

    const newValue = value.split("")
    newValue[index] = input.slice(-1)
    const joined = newValue.join("").slice(0, length)
    onChange(joined)

    if (input && index < length - 1) {
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
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length)
    onChange(pasted)
    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length }).map((_, i) => {
        const digit = value[i] || ""
        const isFilled = digit.length > 0

        return (
          <div
            key={i}
            className={cn(
              "relative w-12 h-14 rounded-xl border-2 bg-card transition-all",
              "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-400/30",
              error ? "border-red-500 animate-shake" : "border-input",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Visual dot — yang user liat */}
            {isFilled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-foreground" />
              </div>
            )}

            {/* Input invisible di atas, opacity 0 */}
            <input
              ref={(el) => {
                inputsRef.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore
              name={`pin-${i}-${Math.random().toString(36).slice(2, 8)}`}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              style={{
                caretColor: 'transparent',
                WebkitTextFillColor: 'transparent',
                WebkitTextSecurity: 'disc',
                color: 'transparent',
                background: 'transparent',
              } as React.CSSProperties}
              className={cn(
                "w-full h-full text-center text-2xl font-bold",
                "rounded-xl outline-none border-0",
                "focus:ring-0",
                disabled && "cursor-not-allowed"
              )}
            />
          </div>
        )
      })}
    </div>
  )
}