"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
    if (result.error) {
      setMessage(result.error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-bold">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input
            className="rounded border p-2"
            placeholder="Full name (use a made-up name)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          className="rounded border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border p-2"
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button className="rounded bg-black p-2 text-white" type="submit">
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      {message && <p className="mt-3 text-red-600">{message}</p>}
      <button
        className="mt-4 text-sm underline"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login"
          ? "New client? Create an account"
          : "Already have an account? Log in"}
      </button>
    </main>
  );
}