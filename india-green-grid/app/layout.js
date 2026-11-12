import './globals.css';
import Background from '@/components/Background';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'India Green Grid',
  description:
    "A decision-support platform for India's renewable energy transition, built on official CEA and Ministry of Power data."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Background />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-line bg-page/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-3 sm:px-6 md:flex-row md:items-center md:justify-between">
              <p>
                Data: Central Electricity Authority (National Power Portal), MERIT India (Ministry of Power), NASA POWER.
              </p>
              <p>Hackathon prototype. Estimates are for guidance, not for regulatory filings.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
