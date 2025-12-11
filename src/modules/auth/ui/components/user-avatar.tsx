"use client"

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";

interface Props {
  className?: {
    container?: string
    fallback?: string
  }
  src?: string
  name: string
}

export const UserAvatar = ({ className, src, name }: Props) => {
  const fallback = useMemo(() => {
    const leadingVowels = /^[เแโใไ]/
    const prefixes = ["นาย", "นางสาว", "นาง"]

    const getFallback = (str: string) => {
      if (!str) return "?"

      // ตัด prefix ออกก่อน
      let cleaned = str.trim()
      for (const prefix of prefixes) {
        if (cleaned.startsWith(prefix)) {
          cleaned = cleaned.slice(prefix.length).trim()
          break
        }
      }

      // หาอักษรแรกที่ไม่ใช่สระนำ
      for (const ch of cleaned) {
        if (!leadingVowels.test(ch)) {
          return ch.toUpperCase()
        }
      }
      return cleaned.charAt(0).toUpperCase()
    }

    return getFallback(name)
  }, [name])

  return (
    <Avatar className={cn(className?.container)}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className={cn(className?.fallback, "bg-marine text-white font-bold select-none")}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  )
}
