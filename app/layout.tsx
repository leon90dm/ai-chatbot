import { Toaster } from 'react-hot-toast'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { auth } from '@/auth'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { ClerkProvider } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export const metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: {
    default: 'SnplChat',
    template: `%s - Snpl AI Chatbot`
  },
  description: 'An GPT4-powered chatbot good at chat and draw.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const session = auth();
  console.log("session", session)
  if (!session?.user) {
    redirect('/sign-in')
  }
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            'font-sans antialiased',
            GeistSans.variable,
            GeistMono.variable
          )}
        >
          <Toaster />
          <Providers
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex flex-col flex-1 bg-muted/50">
                {children}
              </main>
            </div>
            <TailwindIndicator />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
