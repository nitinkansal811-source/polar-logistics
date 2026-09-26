import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NCPOR Polar Logistics & Asset Management Console | MoES',
  description:
    'Integrated Polar Expedition Logistics, Multi-Modal Route Optimization, Cryptographic Custody, and Offline Field Operations for Indian Antarctic Expeditions (Maitri & Bharati).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-polar-950 text-slate-100 min-h-screen antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
