"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const supabase = getSupabase();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) return <p className="p-6">Loading...</p>;

  return (
    <>
      <main className="mx-auto max-w-xl p-6">
        <h1 className="font-display mt-4 text-3xl font-bold">
          Hello, {profile.full_name}
        </h1>
        <p className="mb-6 mt-1 text-cocoa">
          Logged in as <b className="text-gold-dark">{profile.role}</b>
        </p>

        <div className="card flex flex-col gap-3">
          {(profile.role === "owner" || profile.role === "stylist") && (
            <Link href="/staff" className="btn btn-gold">View bookings</Link>
          )}
          {profile.role === "client" && (
            <Link href="/book" className="btn btn-gold">Book an appointment</Link>
          )}
          <Link href="/" className="btn btn-outline">Back to home page</Link>
        </div>

        <button className="mt-6 text-sm text-cocoa underline" onClick={signOut}>
          Log out
        </button>
      </main>
    </>
  );
}