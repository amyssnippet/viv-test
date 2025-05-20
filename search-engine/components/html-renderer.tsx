"use client"

import { useEffect, useRef } from "react"

export function HtmlRenderer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !html) return

    // Clear previous content
    containerRef.current.innerHTML = ""

    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    // Process the HTML to make it work in our context
    processHtml(tempDiv)

    // Append the processed content
    containerRef.current.appendChild(tempDiv)

    // Add event listeners for forms and links
    addEventListeners(containerRef.current)

    return () => {
      // Clean up event listeners when component unmounts
      if (containerRef.current) {
        removeEventListeners(containerRef.current)
      }
    }
  }, [html])

  return (
    <div className="search-results-container" ref={containerRef}>
      {/* HTML content will be injected here */}
    </div>
  )
}

function processHtml(element: HTMLElement) {
  // Remove scripts for security
  const scripts = element.querySelectorAll("script")
  scripts.forEach((script) => script.remove())

  // Fix relative URLs
  const links = element.querySelectorAll("a[href]")
  links.forEach((link) => {
    const href = link.getAttribute("href")
    if (href && href.startsWith("/") && !href.startsWith("//")) {
      link.setAttribute("href", `https://search.cosinv.com${href}`)
    }
  })

  // Fix relative image sources
  const images = element.querySelectorAll("img[src]")
  images.forEach((img) => {
    const src = img.getAttribute("src")
    if (src && src.startsWith("/") && !src.startsWith("//")) {
      img.setAttribute("src", `https://search.cosinv.com${src}`)
    }
  })

  // Fix form actions
  const forms = element.querySelectorAll("form[action]")
  forms.forEach((form) => {
    const action = form.getAttribute("action")
    if (action && action.startsWith("/") && !action.startsWith("//")) {
      form.setAttribute("action", `https://search.cosinv.com${action}`)
    }
    // Add target="_blank" to open in new tab
    form.setAttribute("target", "_blank")
  })

  // Fix CSS links
  const cssLinks = element.querySelectorAll("link[rel='stylesheet']")
  cssLinks.forEach((link) => {
    const href = link.getAttribute("href")
    if (href && href.startsWith("/") && !href.startsWith("//")) {
      link.setAttribute("href", `https://search.cosinv.com${href}`)
    }
  })
}

function addEventListeners(element: HTMLElement) {
  // Handle form submissions
  const forms = element.querySelectorAll("form")
  forms.forEach((form) => {
    form.addEventListener("submit", handleFormSubmit)
  })

  // Handle link clicks
  const links = element.querySelectorAll("a")
  links.forEach((link) => {
    link.addEventListener("click", handleLinkClick)
  })
}

function removeEventListeners(element: HTMLElement) {
  const forms = element.querySelectorAll("form")
  forms.forEach((form) => {
    form.removeEventListener("submit", handleFormSubmit)
  })

  const links = element.querySelectorAll("a")
  links.forEach((link) => {
    link.removeEventListener("click", handleLinkClick)
  })
}

function handleFormSubmit(event: Event) {
  const form = event.currentTarget as HTMLFormElement

  // If the form is for search, we can handle it in our app
  if (form.action.includes("/search")) {
    event.preventDefault()

    // Get form data
    const formData = new FormData(form)
    const query = formData.get("q")

    if (query) {
      // Navigate to our search page with the query
      window.location.href = `/search?q=${encodeURIComponent(query.toString())}`
    }
  }
}

function handleLinkClick(event: Event) {
  const link = event.currentTarget as HTMLAnchorElement

  // If it's an internal search link, handle it in our app
  if (link.href.includes("/search") && link.href.includes("q=")) {
    event.preventDefault()

    // Extract the query parameter
    const url = new URL(link.href)
    const query = url.searchParams.get("q")

    if (query) {
      // Navigate to our search page with the query
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    }
  }
}
