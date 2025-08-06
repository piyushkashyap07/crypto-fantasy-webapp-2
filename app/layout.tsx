import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThirdwebProvider } from "thirdweb/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "pumpfantasy",
  description: "Join crypto trading contests and compete for prizes",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">{children}</div>
        </ThirdwebProvider>
      </body>
    </html>
  )
}
