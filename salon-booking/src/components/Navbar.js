"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "../lib/supabase";

function NavLink({ href, active, onClick, mobile, children }) {
  const base = mobile
    ? "block rounded-xl px-4 py-3 text-base font-medium"
    : "border-b-2 px-1 py-1 text-sm font-medium transition";
  const state = mobile
    ? active
      ? "bg-cocoa text-gold"
      : "text-cream hover:bg-cocoa"
    : active
    ? "border-gold text-gold"
    : "border-transparent text-sand hover:text-gold";
  return (
    <Link href={href} onClick={onClick} className={`${base} ${state}`}>
      {children}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState(null); // null = logged out
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    let cancelled = false;

    async function loadRole(userId) {
      if (!userId) {
        if (!cancelled) { setRole(null); setReady(true); }
        return;
      }
      const { data } = await supabase
        .from("profiles").select("role").eq("id", userId).single();
      if (!cancelled) { setRole(data?.role ?? "client"); setReady(true); }
    }

    supabase.auth.getUser().then(({ data: { user } }) => loadRole(user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // run outside the callback, as Supabase recommends
      setTimeout(() => loadRole(session?.user?.id), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  function close() {
    setOpen(false);
  }

  async function signOut() {
    close();
    await getSupabase().auth.signOut();
    router.push("/login");
  }

  const isStaff = role === "owner" || role === "stylist";
  const links = [
    { href: "/", label: "Home" },
    { href: "/#work", label: "Our work" },
    { href: "/#services", label: "Services" },
    { href: "/book", label: "Booking slots" },
    ...(isStaff
      ? [
          { href: "/calendar", label: "Calendar" },
          { href: "/staff", label: "Bookings" },
        ]
      : []),
    ...(ready && role ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];
  const showBook = pathname !== "/book";

  return (
    <nav className="sticky top-0 z-50 border-b border-cocoa bg-espresso text-cream shadow-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" onClick={close} className="flex items-center gap-3">
          <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-gold text-lg font-bold text-espresso">
            S
          </span>
          <span className="leading-tight">
            <span className="font-display block text-base font-semibold">
              Sbongile&apos;s
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-gold">
              Hair Salon
            </span>
          </span>
        </Link>

        {/* desktop */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <NavLink key={l.label} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-4 md:flex">
          {ready && role ? (
            <button onClick={signOut} className="text-sm text-sand hover:text-gold">
              Log out
            </button>
          ) : (
            ready && (
              <Link href="/login" className="text-sm text-sand hover:text-gold">
                Log in
              </Link>
            )
          )}
          {showBook && (
            <Link
              href="/book"
              className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-espresso transition hover:bg-gold-dark hover:text-white"
            >
              Book now
            </Link>
          )}
        </div>

        {/* mobile */}
        <div className="flex items-center gap-3 md:hidden">
          {showBook && (
            <Link
              href="/book"
              onClick={close}
              className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-espresso"
            >
              Book
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-cocoa"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-cocoa bg-espresso px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.label}
                href={l.href}
                active={pathname === l.href}
                onClick={close}
                mobile
              >
                {l.label}
              </NavLink>
            ))}
            {ready && role ? (
              <button
                onClick={signOut}
                className="rounded-xl px-4 py-3 text-left text-base text-sand hover:bg-cocoa"
              >
                Log out
              </button>
            ) : (
              ready && (
                <NavLink href="/login" active={pathname === "/login"} onClick={close} mobile>
                  Log in
                </NavLink>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}