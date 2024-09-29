import { Kumbh_Sans } from 'next/font/google'
import './globals.css'

import { Toaster } from '@/components/ui/toaster'
import { auth } from '@/auth'
import { SessionProvider } from 'next-auth/react'
import { PrimeReactProvider } from 'primereact/api'
import ClientLayout from '@/components/ClientLayout'

export const metadata = {
  title: "CLC Admissions Portal",
  description: "CLC Admissions Portal",
};

const font = Kumbh_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default async function RootLayout({ children }) {
    const session = await auth()

    return (
        <SessionProvider session={session}>
            <html lang="en">
                <PrimeReactProvider>
                    <body className={font.className}>
                        <ClientLayout>{children}</ClientLayout>
                        <Toaster />
                    </body>
                </PrimeReactProvider>
            </html>
        </SessionProvider>
    )
}
