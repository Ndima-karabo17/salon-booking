"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";

const TZ = "Africa/Johannesburg";
const OFFSET = "+02:00";
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const dayOf = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dateOf = (iso) =>
  new Date(iso).toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

export default function StaffPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [role, setRole] = useState(null);
  const [todayStr, setTodayStr] = useState("");
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("today");
  const [error, setError] = useState("");
  const [reschedId, setReschedId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newHour, setNewHour] = useState("");
  const [payId, setPayId] = useState(null);
  const [payMethod, setPayMethod] = useState("transfer");
  const [payRef, setPayRef] = useState("");
  const [services, setServices] = useState([]);
  const [walkOpen, setWalkOpen] = useState(false);
  const [walkService, setWalkService] = useState("");
  const [walkTime, setWalkTime] = useState("");
  const [walkLabel, setWalkLabel] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, starts_at, status, deposit_status, deposit_method, deposit_reference, deposit_confirmed_at, rescheduled_from, walk_in_label, client:profiles!client_id(full_name), services(name, price_rand, deposit_rand)"
      )
      .order("starts_at", { ascending: true });
    if (error) setError(error.message);
    setBookings(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!p || p.role === "client") { router.push("/dashboard"); return; }
      setTodayStr(new Date().toLocaleDateString("en-CA", { timeZone: TZ }));
      setRole(p.role);
      const { data: svc } = await supabase
        .from("services").select("id, name, duration_minutes").eq("active", true).order("id");
      setServices(svc || []);
      if (svc && svc.length) setWalkService(String(svc[0].id));
      setWalkTime(
        new Date().toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })
      );
      load();
    }
    init();
  }, []);

  async function update(id, changes) {
    setError("");
    const { error } = await supabase.from("bookings").update(changes).eq("id", id);
    if (error) {
      setError(
        error.message.includes("slot_full")
          ? "That time is already full. Please pick another time."
          : error.message.includes("owner_only")
          ? "Only the owner can change deposits."
          : error.message
      );
      return false;
    }
    load();
    return true;
  }

  function startResched(b) {
    setError("");
    setPayId(null);
    setReschedId(b.id);
    setNewDate(dayOf(b.starts_at));
    setNewHour("");
  }

  async function saveResched(b) {
    if (!newDate || newHour === "") {
      setError("Please choose a new date and time.");
      return;
    }
    const iso = `${newDate}T${String(newHour).padStart(2, "0")}:00:00${OFFSET}`;
    if (new Date(iso).getTime() < Date.now()) {
      setError("That time has already passed.");
      return;
    }
    const ok = await update(b.id, { starts_at: iso, rescheduled_from: b.starts_at });
    if (ok) setReschedId(null);
  }

  function startPay(b) {
    setError("");
    setReschedId(null);
    setPayId(b.id);
    setPayMethod("transfer");
    setPayRef("");
  }

  async function savePay(b) {
    const ok = await update(b.id, {
      deposit_status: "paid",
      deposit_method: payMethod,
      deposit_reference: payRef.trim() || null,
      deposit_confirmed_at: new Date().toISOString(),
    });
    if (ok) setPayId(null);
  }

  async function saveWalkIn() {
    setError("");
    if (!walkService || !walkTime) {
      setError("Please choose a style and a start time for the walk-in.");
      return;
    }
    const iso = `${todayStr}T${walkTime}:00${OFFSET}`;
    const { error } = await supabase.from("bookings").insert({
      client_id: null,
      service_id: Number(walkService),
      starts_at: iso,
      status: "arrived",
      walk_in_label: walkLabel.trim() || "Walk-in",
    });
    if (error) {
      setError(
        error.message.includes("slot_full")
          ? "The salon is full at that time. Reschedule a booking first, or pick another time."
          : error.message
      );
      return;
    }
    setWalkOpen(false);
    setWalkLabel("");
    setTab("today");
    load();
  }

  if (!role || !todayStr) return <p className="p-6">Loading...</p>;

  const shown = bookings.filter((b) => {
    if (tab === "unpaid") {
      return (
        b.status === "booked" &&
        b.deposit_status === "pending" &&
        b.services?.deposit_rand > 0
      );
    }
    const d = dayOf(b.starts_at);
    if (tab === "today") return d === todayStr;
    if (tab === "upcoming") return d > todayStr;
    return d < todayStr;
  });

  const noShows = bookings.filter((b) => b.status === "no_show").length;
  const pendingDeposits = bookings.filter(
    (b) =>
      b.status === "booked" &&
      b.deposit_status === "pending" &&
      b.services?.deposit_rand > 0
  ).length;

  const Btn = ({ children, onClick, tone = "" }) => (
    <button onClick={onClick} className={`rounded border px-3 py-1 text-sm ${tone}`}>
      {children}
    </button>
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/dashboard" className="text-sm underline">← Back</Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">
        {role === "owner" ? "Owner" : "Stylist"}: bookings
      </h1>
      <p className="mb-4 text-sm text-gray-600">
        Deposits waiting: <b>{pendingDeposits}</b> · No-shows recorded: <b>{noShows}</b>
      </p>

      <div className="mb-4">
        <Btn tone="bg-green-100" onClick={() => { setError(""); setWalkOpen(!walkOpen); }}>
          + Add walk-in
        </Btn>
        {walkOpen && (
          <div className="mt-3 rounded bg-gray-50 p-3">
            <p className="mb-2 text-sm font-semibold">
              A walk-in is in the chair now. Do not enter real names.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={walkService}
                onChange={(e) => setWalkService(e.target.value)}
                className="rounded border p-2"
              >
                {services.map((sv) => (
                  <option key={sv.id} value={sv.id}>{sv.name}</option>
                ))}
              </select>
              <input
                type="time"
                value={walkTime}
                onChange={(e) => setWalkTime(e.target.value)}
                className="rounded border p-2"
              />
              <input
                value={walkLabel}
                onChange={(e) => setWalkLabel(e.target.value)}
                placeholder="Label (e.g. Walk-in 1)"
                className="rounded border p-2"
              />
              <Btn tone="bg-green-100" onClick={saveWalkIn}>Save walk-in</Btn>
              <Btn onClick={() => setWalkOpen(false)}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[["today", "Today"], ["upcoming", "Upcoming"], ["unpaid", "Unpaid deposits"], ["past", "Past"]].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded border px-4 py-2 ${tab === k ? "bg-black text-white" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-red-600">{error}</p>}
      {shown.length === 0 && <p>No bookings here.</p>}

      <ul className="flex flex-col gap-3">
        {shown.map((b) => (
          <li key={b.id} className="rounded border p-3">
            <div className="flex justify-between">
              <b>{dateOf(b.starts_at)} · {timeOf(b.starts_at)}</b>
              <span className="text-sm">Ref SALON-{b.id}</span>
            </div>
            <p>{b.client ? (b.client.full_name || "Client") : (b.walk_in_label === "Walk-in" ? "Walk-in" : `${b.walk_in_label} (walk-in)`)} · {b.services?.name}</p>
            <p className="text-sm">
              Status: <b>{b.status}</b> ·{" "}
              {b.services?.deposit_rand > 0 ? (
                <>
                  Deposit R{b.services.deposit_rand}:{" "}
                  <b className={b.deposit_status === "paid" ? "text-green-700" : "text-orange-600"}>
                    {b.deposit_status}
                  </b>
                </>
              ) : (
                <>No deposit needed</>
              )}
            </p>
            {b.deposit_status === "paid" && b.deposit_confirmed_at && (
              <p className="text-sm text-green-700">
                Deposit confirmed ({b.deposit_method}
                {b.deposit_reference ? `, ref ${b.deposit_reference}` : ""}) on{" "}
                {dateOf(b.deposit_confirmed_at)} {timeOf(b.deposit_confirmed_at)}
              </p>
            )}
            {b.rescheduled_from && (
              <p className="text-sm text-gray-600">
                Moved from {dateOf(b.rescheduled_from)} {timeOf(b.rescheduled_from)}
              </p>
            )}

            {(b.status === "booked" || b.status === "arrived") && (
              <div className="mt-2 flex flex-wrap gap-2">
                {role === "owner" && b.deposit_status === "pending" && b.services?.deposit_rand > 0 && (
                  <Btn tone="bg-green-100" onClick={() => startPay(b)}>Confirm deposit paid</Btn>
                )}
                {role === "owner" && b.deposit_status === "paid" && (
                  <Btn
                    onClick={() =>
                      update(b.id, {
                        deposit_status: "pending",
                        deposit_method: null,
                        deposit_reference: null,
                        deposit_confirmed_at: null,
                      })
                    }
                  >
                    Undo deposit
                  </Btn>
                )}
                {b.status === "booked" && (
                  <Btn onClick={() => update(b.id, { status: "arrived" })}>Arrived</Btn>
                )}
                {b.status === "arrived" && (
                  <Btn onClick={() => update(b.id, { status: "done" })}>Done</Btn>
                )}
                {b.status === "booked" && (
                  <>
                    <Btn tone="bg-yellow-100" onClick={() => startResched(b)}>Reschedule</Btn>
                    <Btn onClick={() => update(b.id, { status: "no_show" })}>No-show</Btn>
                    <Btn onClick={() => update(b.id, { status: "cancelled" })}>Cancel</Btn>
                  </>
                )}
              </div>
            )}

            {reschedId === b.id && (
              <div className="mt-3 rounded bg-gray-50 p-3">
                <p className="mb-2 text-sm font-semibold">Move this booking to:</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    min={todayStr}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="rounded border p-2"
                  />
                  <select
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    className="rounded border p-2"
                  >
                    <option value="">Time</option>
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                  <Btn tone="bg-green-100" onClick={() => saveResched(b)}>Save</Btn>
                  <Btn onClick={() => setReschedId(null)}>Cancel</Btn>
                </div>
              </div>
            )}

            {payId === b.id && (
              <div className="mt-3 rounded bg-gray-50 p-3">
                <p className="mb-2 text-sm font-semibold">
                  Confirm deposit of R{b.services?.deposit_rand}:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="rounded border p-2"
                  >
                    <option value="transfer">Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                  <input
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Reference (optional)"
                    className="rounded border p-2"
                  />
                  <Btn tone="bg-green-100" onClick={() => savePay(b)}>Save</Btn>
                  <Btn onClick={() => setPayId(null)}>Cancel</Btn>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}