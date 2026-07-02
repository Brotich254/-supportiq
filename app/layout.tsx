import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'SupportIQ — AI Customer Support',
  description: 'AI-powered customer support that resolves 80% of tickets automatically.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{ style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' } }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
