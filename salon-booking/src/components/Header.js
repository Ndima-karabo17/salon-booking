import Link from "next/link";
export default function Header() {
  return (
    <header className="bg-espresso text-cream">
      <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg font-semibold">
          Sbongile&apos;s Hair Salon
        </Link>
        <Link href="/book" className="text-sm font-semibold text-gold hover:underline">
          Book
        </Link>
      </div>
    </header>
  );
}