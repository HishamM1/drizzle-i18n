import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Manrope } from 'next/font/google';
import type { Metadata } from 'next';

const manrope = Manrope({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'drizzle-i18n Docs',
    template: '%s | drizzle-i18n Docs',
  },
  description:
    'Documentation for drizzle-i18n, a type-safe localization layer for Drizzle ORM.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOCS_URL ?? 'http://localhost:3000'),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={manrope.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
