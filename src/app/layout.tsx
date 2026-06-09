import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HDB BTO Ballot Tracker — Calculate Your Ballot Odds",
  description:
    "Free tool for Singaporeans to estimate BTO ballot odds based on historical application rates by town, flat type, and applicant profile.",
  openGraph: {
    title: "HDB BTO Ballot Tracker",
    description: "Estimate your BTO ballot odds based on historical subscription rates.",
    type: "website",
  },
};

function Nav() {
  return (
    <nav className="border-b border-[#334155] bg-[#0b1120]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[#EF1826] font-bold text-lg tracking-tight">BTO</span>
          <span className="text-slate-300 font-medium text-sm">Ballot Tracker</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-[#1e293b]"
          >
            Calculator
          </Link>
          <Link
            href="/exercises"
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-[#1e293b]"
          >
            Exercises
          </Link>
          <Link
            href="/compare"
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-[#1e293b]"
          >
            Compare
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#334155] mt-auto py-6">
      <div className="max-w-5xl mx-auto px-4 text-center space-y-1">
        <p className="text-xs text-slate-500">
          Data sourced from HDB official releases, Seedly, PropertyGuru, and Ohmyhome.
          For reference only — not financial or housing advice.
        </p>
        <p className="text-xs text-slate-600">
          1.7× threshold is HDB&apos;s published guidance for competitive ballots.
        </p>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0b1120] text-slate-100">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
