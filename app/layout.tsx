import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "Koperasi Literasi - Perpustakaan Komunitas",
  description: "Sistem Manajemen Peminjaman Buku Terdesentralisasi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        <Navbar />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
