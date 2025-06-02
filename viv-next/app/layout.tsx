import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"
import { GoogleOAuthProvider } from "@react-oauth/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VIV AI - Intelligent Chat Assistant",
  description: "Advanced AI chat application with real-time messaging and API management",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId="612742129961-98avllgdrs8l4i4duvt0e036loluk33c.apps.googleusercontent.com">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1E1E1F",
                color: "#fff",
                border: "1px solid #333",
              },
            }}
          />
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
