import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchSuggestionsProps {
  suggestions: string[]
}

export function SearchSuggestions({ suggestions }: SearchSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="bg-slate-50 pb-2">
        <CardTitle className="text-lg">Related Searches</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Link
              key={index}
              href={`/search?q=${encodeURIComponent(suggestion)}`}
              className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-blue-100 hover:text-blue-700"
            >
              {suggestion}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
