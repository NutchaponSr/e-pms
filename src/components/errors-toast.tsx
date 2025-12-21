"use client"

import { AlertCircle, ChevronDown, ChevronUp, XCircle } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ErrorToastProps {
  title: string
  errors: Array<{ row: number; message: string }>
  maxVisible?: number
}

export const ErrorsToast = ({ title, errors, maxVisible = 3 }: ErrorToastProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasMore = errors.length > maxVisible
  const displayedErrors = isExpanded ? errors : errors.slice(0, maxVisible)

  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <XCircle className="h-5 w-5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-red-900 dark:text-red-100">{title}</div>
          <div className="text-xs text-red-700 dark:text-red-300 mt-1">
            Found {errors.length} validation {errors.length === 1 ? "error" : "errors"}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
        {displayedErrors.map((error, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950/30 rounded-md p-2.5 border border-red-200 dark:border-red-900"
          >
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-medium text-red-900 dark:text-red-100">Row {error.row}:</span>{" "}
              <span className="text-red-700 dark:text-red-300 wrap-break-word">{error.message}</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show {errors.length - maxVisible} more {errors.length - maxVisible === 1 ? "error" : "errors"}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
