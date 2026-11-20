"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";
import Header from "../../src/components/Header";

const SLOT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // salon open 07:00-19:00
const CLOSE_HOUR = 19;
const CAPACITY = 2; // must match the database trigger
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
  const [reload, setReload] = useState(0);
  const [hour, setHour] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  const service = services.find((s) => String(s.id) === String(serviceId));

  async function loadMyBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("id, starts_at, status, deposit_status, rescheduled_from, services(name, deposit_rand)")
      .order("starts_at", { ascending: true });
    setMyBookings(data || []);
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
    if (!date) return;
    let cancelled = false;
    async function fetchBusy() {
      const { data } = await supabase.rpc("busy_times", {
        day_start: `${date}T00:00:00${OFFSET}`,
        day_end: `${date}T23:59:59${OFFSET}`,
      });
      if (cancelled) return;
      setBusy(
        (data || []).map((r) => ({
          start: new Date(r.starts_at).getTime(),
          end: new Date(r.ends_at).getTime(),
        }))
      );
    }
    fetchBusy();
    return () => { cancelled = true; };
  }, [date, reload]);

  function isUnavailable(h) {
    if (!service) return true;
    const start = new Date(slotIso(date, h)).getTime();
    const end = start + service.duration_minutes * 60000;
    const closing = new Date(slotIso(date, CLOSE_HOUR)).getTime();
    if (start < Date || end > closing) return true;
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
      setReload((r) => r + 1);
      return;
    }
    setConfirmation({ id: data.id, service, date, hour });
    setHour(null);
    setReload((r) => r + 1);
    loadMyBookings();
  }

  if (!user || !today) return <p className="p-6">Loading...</p>;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl p-6">
        <h1 className="font-display mb-1 mt-4 text-3xl font-bold">Book your chair</h1>
        <p className="mb-6 text-cocoa">Three quick steps, then pay your deposit to hold the slot.</p>

        <div className="card mb-5">
          <label className="mb-2 block font-semibold">1. Choose your style</label>
          <select
            className="field"
            value={serviceId}
            onChange={(e) => { setServiceId(e.target.value); setHour(null); }}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · R{s.price_rand} · {fmtDur(s.duration_minutes)}
              </option>
            ))}
          </select>
        </div>

        <div className="card mb-5">
          <label className="mb-2 block font-semibold">2. Choose a date</label>
          <input
            className="field"
            type="date"
            min={today}
            value={date}
            onChange={(e) => { setDate(e.target.value); setHour(null); }}
          />
        </div>

        <div className="card mb-5">
          <label className="mb-3 block font-semibold">3. Choose a start time</label>
          <div className="flex flex-wrap gap-2">
            {SLOT_HOURS.map((h) => {
              const off = isUnavailable(h);
              return (
                <button
                  key={h}
                  disabled={off}
                  onClick={() => setHour(h)}
                  className={`slot ${hour === h ? "slot-on" : ""}`}
                >
                  {String(h).padStart(2, "0")}:00
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-cocoa">
            Crossed-out times are full, already past, or would run after closing.
          </p>
        </div>

        {service && (
          <p className="mb-5 rounded-xl bg-sand p-4">
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

        <button className="btn btn-gold w-full" onClick={book}>Book now</button>
        {message && <p className="mt-3 text-clay">{message}</p>}

        {confirmation && (
          <div className="mt-6 rounded-2xl border-2 border-gold bg-white p-5">
            <p className="font-display text-xl font-bold text-gold-dark">Booking received!</p>
            <p className="mt-1">
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
            <p className="mt-2 text-sm text-cocoa">
              Salon: Sbongile&apos;s Hair Salon, Zone 1, Jujuvalley, Seshego,
              Polokwane. Banking details: ask the salon (to be added with the
              owner&apos;s permission).
            </p>
          </div>
        )}

        <h2 className="font-display mb-3 mt-10 text-2xl font-bold">Your bookings</h2>
        {myBookings.length === 0 && <p className="text-cocoa">No bookings yet.</p>}
        <ul className="flex flex-col gap-3">
          {myBookings.map((b) => (
            <li key={b.id} className="card">
              <b>{b.services?.name}</b>
              <br />
              {new Date(b.starts_at).toLocaleString("en-ZA", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: TZ,
              })}
              <br />
              <span className="text-sm text-cocoa">
                Status: {b.status} · Deposit: {b.deposit_status} · Ref: SALON-{b.id}
              </span>
              {b.rescheduled_from && (
                <>
                  <br />
                  <span className="text-sm text-cocoa">
                    Moved by the salon from{" "}
                    {new Date(b.rescheduled_from).toLocaleString("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: TZ,
                    })}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}