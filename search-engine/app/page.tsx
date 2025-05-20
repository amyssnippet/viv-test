import { SearchForm } from "@/components/search-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            <span className="text-blue-600">Cos</span>Search
          </h1>
          <p className="text-lg text-slate-600">Find what you're looking for across the web</p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <SearchForm />
        </div>

        <div className="flex justify-center space-x-6 text-sm text-slate-500">
          <a href="#" className="hover:text-blue-600">
            About
          </a>
          <a href="#" className="hover:text-blue-600">
            Privacy
          </a>
          <a href="#" className="hover:text-blue-600">
            Terms
          </a>
        </div>
      </div>

      <div className="mt-16 text-center text-sm text-slate-500">
        <p>Powered by search.cosinv.com</p>
      </div>
    </div>
  )
}
