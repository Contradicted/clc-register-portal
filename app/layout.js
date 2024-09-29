import { Kumbh_Sans } from 'next/font/google'
import './globals.css'

import { Toaster } from "@/components/ui/toaster";
import { PrimeReactProvider } from "primereact/api";
import ClientLayout from "@/components/ClientLayout";
import { auth } from "@/auth";
import NextAuthProvider from "@/providers/NextAuthProvider";

export const metadata = {
  title: "CLC Admissions Portal",
  description: "CLC Admissions Portal",
  icons: {
    icon: "/favicon.ico",
  },
};

const font = Kumbh_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default async function RootLayout({ children }) {
  const session = await auth();
  const sessionKey = new Date().valueOf();

  return (
    <html lang="en">
      <PrimeReactProvider>
        <body className={font.className}>
          <NextAuthProvider session={session} sessionKey={sessionKey}>
            <ClientLayout>{children}</ClientLayout>
            <Toaster />
          </NextAuthProvider>
        </body>
      </PrimeReactProvider>
    </html>
  );
}
