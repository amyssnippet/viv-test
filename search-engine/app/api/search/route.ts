import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q") || ""

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    // Make a request to the search.cosinv.com API
    const response = await fetch(`https://search.cosinv.com/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; CosSearchApp/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`)
    }

    // Get the HTML response
    const html = await response.text()

    // Return the HTML response
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 })
  }
}
