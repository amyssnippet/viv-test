"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search the web..."
          className="h-14 w-full rounded-full border-2 border-slate-200 pl-5 pr-14 text-lg shadow-sm focus-visible:border-blue-500 focus-visible:ring-blue-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-2 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
