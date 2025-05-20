import Link from "next/link"
import { SearchForm } from "@/components/search-form"

export function SearchHeader({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">
            <span className="text-blue-600">Cos</span>Search
          </h1>
        </Link>
        <div className="w-full max-w-2xl px-4">
          <SearchForm defaultValue={defaultValue} />
        </div>
      </div>
    </header>
  )
}
