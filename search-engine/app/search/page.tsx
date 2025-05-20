import { SearchHeader } from "@/components/search-header"
import { SearchResults } from "@/components/search-results"

interface SearchPageProps {
  searchParams: { q?: string }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""

  return (
    <div className="min-h-screen bg-white">
      <SearchHeader defaultValue={query} />
      <main className="container mx-auto max-w-6xl px-4 py-6">
        {query ? (
          <SearchResults query={query} />
        ) : (
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-semibold text-slate-700">Enter a search term to begin</h2>
          </div>
        )}
      </main>
    </div>
  )
}
