import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Roadmap de TI — Energia de Todos',
  description: 'Acompanhamento do roadmap de infraestrutura e governança de TI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}