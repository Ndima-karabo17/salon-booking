"use client";
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
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-bold">Hello, {profile.full_name}</h1>
      <p className="mb-4">You are logged in as: <b>{profile.role}</b></p>
      {(profile.role === "owner" || profile.role === "stylist") && (
  <a href="/staff" className="inline-block rounded bg-black px-4 py-2 text-white">
    View bookings
  </a>
)}
      {profile.role === "client" && (
  <a href="/book" className="inline-block rounded bg-black px-4 py-2 text-white">
    Book an appointment
  </a>
)}
       <button className="mt-6 underline" onClick={signOut}>Log out</button>
    </main>
  );
}