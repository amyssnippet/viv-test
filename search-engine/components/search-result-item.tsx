import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SearchResult {
  url: string
  title: string
  content: string
  thumbnail?: string
  publishedDate?: string
  engines?: string[]
  score?: number
}

export function SearchResultItem({ result }: { result: SearchResult }) {
  // Extract domain from URL
  const domain = result.url ? new URL(result.url).hostname.replace("www.", "") : ""

  // Format date if available
  const formattedDate = result.publishedDate
    ? new Date(result.publishedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null

  return (
    <Card className="overflow-hidden border-slate-200 transition-all hover:border-blue-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{domain}</p>
              <Link
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
              >
                <h3 className="text-lg font-semibold">{result.title}</h3>
                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </div>
            {result.score !== undefined && (
              <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                Score: {result.score.toFixed(1)}
              </div>
            )}
          </div>

          <p className="text-slate-700">{result.content}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {formattedDate && <span>{formattedDate}</span>}
            {result.engines && result.engines.length > 0 && (
              <span>Sources: {result.engines.slice(0, 3).join(", ")}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
