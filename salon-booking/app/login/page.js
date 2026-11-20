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
    <>
      <main className="mx-auto max-w-sm p-6">
        <h1 className="font-display mb-1 mt-4 text-3xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mb-6 text-cocoa">
          {mode === "login"
            ? "Log in to book and manage your appointments."
            : "Clients can book appointments and track deposits."}
        </p>
        <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
          {mode === "signup" && (
            <input
              className="field"
              placeholder="Full name (use a made-up name)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button className="btn btn-gold" type="submit">
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>
        {message && <p className="mt-3 text-clay">{message}</p>}
        <button
          className="mt-4 text-sm text-cocoa underline"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "New client? Create an account"
            : "Already have an account? Log in"}
        </button>
      </main>
    </>
  );
}