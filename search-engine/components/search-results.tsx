"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { HtmlRenderer } from "@/components/html-renderer"

export function SearchResults({ query }: { query: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`)
        }

        const data = await response.text()
        setHtml(data)
      } catch (err) {
        console.error("Search error:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-slate-600">Searching for "{query}"...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-10 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-xl font-medium text-red-700">Search Error</h2>
        <p className="mt-2 text-red-600">{error}</p>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="mt-10 text-center">
        <h2 className="text-xl font-medium text-slate-700">No results found</h2>
        <p className="mt-2 text-slate-500">Try different keywords or check your search terms</p>
      </div>
    )
  }

  return <HtmlRenderer html={html} />
}
