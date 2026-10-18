import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Diya Virmani · Developer, agentic systems, RAG & ML",
  description: "Diya Virmani, developer in New Delhi working on agentic systems, RAG pipelines, and ML/DL architectures. B.Tech AI & DS at VIPS-TC, graduating 2027.",
  icons: {
    icon: '/favicon.svg',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Analytics/>
        {children}
      </body>
    </html>
  )
}
