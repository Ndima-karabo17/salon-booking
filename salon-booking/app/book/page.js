"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";

const SLOT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // salon open 07:00-19:00
const CLOSE_HOUR = 19;
const CAPACITY = 2; // placeholder: must match the database trigger
const OFFSET = "+02:00"; // South Africa time
const TZ = "Africa/Johannesburg";

function slotIso(date, hour) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00${OFFSET}`;
}
function fmtDur(min) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

export default function BookPage() {
  const router = useRouter();
  const supabase = getSupabase();

  const [today, setToday] = useState("");
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState([]);
  const [hour, setHour] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  const service = services.find((s) => String(s.id) === String(serviceId));

  async function loadMyBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("id, starts_at, status, deposit_status, services(name, deposit_rand)")
      .order("starts_at", { ascending: true });
    setMyBookings(data || []);
  }

  async function loadBusy(d) {
    const { data } = await supabase.rpc("busy_times", {
      day_start: `${d}T00:00:00${OFFSET}`,
      day_end: `${d}T23:59:59${OFFSET}`,
    });
    setBusy(
      (data || []).map((r) => ({
        start: new Date(r.starts_at).getTime(),
        end: new Date(r.ends_at).getTime(),
      }))
    );
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const t = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
      setToday(t);
      setDate(t);
      setUser(user);
      const { data } = await supabase
        .from("services").select("*").eq("active", true).order("id");
      setServices(data || []);
      if (data && data.length) setServiceId(String(data[0].id));
      loadMyBookings();
    }
    init();
  }, []);

  useEffect(() => {
    if (date) {
      loadBusy(date);
      setHour(null);
    }
  }, [date]);

  function isUnavailable(h) {
    if (!service) return true;
    const start = new Date(slotIso(date, h)).getTime();
    const end = start + service.duration_minutes * 60000;
    const closing = new Date(slotIso(date, CLOSE_HOUR)).getTime();
    if (start < Date.now || end > closing) return true;
    const overlapping = busy.filter((b) => b.start < end && b.end > start).length;
    return overlapping >= CAPACITY;
  }

  async function book() {
    setMessage("");
    if (!service || hour === null) {
      setMessage("Please choose a style and a time.");
      return;
    }
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        client_id: user.id,
        service_id: service.id,
        starts_at: slotIso(date, hour),
      })
      .select()
      .single();
    if (error) {
      setMessage(
        error.message.includes("slot_full")
          ? "Sorry, that time was just taken. Please pick another."
          : error.message
      );
      loadBusy(date);
      return;
    }
    setConfirmation({ id: data.id, service, date, hour });
    setHour(null);
    loadBusy(date);
    loadMyBookings();
  }

  if (!user || !today) return <p className="p-6">Loading...</p>;

  return (
    <main className="mx-auto max-w-xl p-6">
      <a href="/dashboard" className="text-sm underline">← Back</a>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Book an appointment</h1>

      <label className="block font-semibold">1. Choose your style</label>
      <select
        className="mb-4 w-full rounded border p-2"
        value={serviceId}
        onChange={(e) => { setServiceId(e.target.value); setHour(null); }}
      >
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · R{s.price_rand} · {fmtDur(s.duration_minutes)}
          </option>
        ))}
      </select>

      <label className="block font-semibold">2. Choose a date</label>
      <input
        className="mb-4 w-full rounded border p-2"
        type="date"
        min={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <label className="block font-semibold">3. Choose a start time</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {SLOT_HOURS.map((h) => {
          const off = isUnavailable(h);
          return (
            <button
              key={h}
              disabled={off}
              onClick={() => setHour(h)}
              className={`rounded border px-4 py-2 ${
                hour === h ? "bg-black text-white" : ""
              } ${off ? "cursor-not-allowed text-gray-400 line-through" : ""}`}
            >
              {String(h).padStart(2, "0")}:00
            </button>
          );
        })}
      </div>

      {service && (
        <p className="mb-4 rounded bg-gray-100 p-3">
          {service.deposit_rand > 0 ? (
            <>
              Deposit to secure your slot: <b>R{service.deposit_rand}</b> (the
              rest is paid at the salon)
            </>
          ) : (
            <>No deposit needed for this service. Pay at the salon.</>
          )}
        </p>
      )}

      <button className="w-full rounded bg-black p-3 text-white" onClick={book}>
        Book now
      </button>
      {message && <p className="mt-3 text-red-600">{message}</p>}

      {confirmation && (
        <div className="mt-6 rounded border border-green-600 p-4">
          <p className="font-bold text-green-700">Booking received!</p>
          <p>
            {confirmation.service.name} on {confirmation.date} at{" "}
            {String(confirmation.hour).padStart(2, "0")}:00
          </p>
          {confirmation.service.deposit_rand > 0 ? (
            <p className="mt-2">
              Please pay the <b>R{confirmation.service.deposit_rand}</b> deposit
              by transfer or cash and use the reference{" "}
              <b>SALON-{confirmation.id}</b>. Your slot is held once the salon
              marks the deposit as paid.
            </p>
          ) : (
            <p className="mt-2">
              Your reference is <b>SALON-{confirmation.id}</b>. No deposit is
              needed.
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Salon location: [placeholder address]. Banking details: [placeholder].
          </p>
        </div>
      )}

      <h2 className="mb-2 mt-8 text-xl font-bold">Your bookings</h2>
      {myBookings.length === 0 && <p>No bookings yet.</p>}
      <ul className="flex flex-col gap-2">
        {myBookings.map((b) => (
          <li key={b.id} className="rounded border p-3">
            <b>{b.services?.name}</b>
            <br />
            {new Date(b.starts_at).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: TZ,
            })}
            <br />
            Status: {b.status} · Deposit: {b.deposit_status} · Ref: SALON-{b.id}
          </li>
        ))}
      </ul>
    </main>
  );
}