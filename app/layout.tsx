import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HireX | Revolutionize Your Hiring Process',
  description: 'Automate candidate sourcing, assessment, and evaluation with our AI-powered HR platform',
  keywords: 'HR automation, hiring, recruitment, candidate assessment, AI hiring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 mx-auto w-[80%]">{children}</main>
            <footer className="py-6 md:py-8 border-t flex justify-center">
              <div className="w-full max-w-[80%] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>© 2025 HireX. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}