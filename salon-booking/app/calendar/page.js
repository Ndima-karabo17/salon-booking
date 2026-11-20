"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../src/lib/supabase";

const TZ = "Africa/Johannesburg";
const OFFSET = "+02:00";
const START_H = 7;
const END_H = 19;
const PX = 64; // pixels per hour
const STRIP_BEFORE = 2;
const STRIP_AFTER = 11;

const dayOf = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const timeOf = (ms) =>
  new Date(ms).toLocaleTimeString("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return {
    weekday: d.toLocaleDateString("en-ZA", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-ZA", { day: "numeric", timeZone: "UTC" }),
    full: d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  };
}

// place overlapping bookings side by side
function assignLanes(items) {
  const laneEnds = [];
  const placed = items.map((it) => {
    let lane = laneEnds.findIndex((e) => e <= it.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    return { ...it, lane };
  });
  return { placed, total: Math.max(laneEnds.length, 1) };
}

const STATUS_STYLE = {
  booked: "border-gold bg-amber-100",
  arrived: "border-green-600 bg-green-100",
  done: "border-gray-400 bg-gray-100 text-gray-600",
  no_show: "border-clay bg-red-100",
};
const STATUS_LABEL = {
  booked: "Booked",
  arrived: "In the chair",
  done: "Done",
  no_show: "No-show",
};

export default function CalendarPage() {
  const router = useRouter();
  const supabase = getSupabase();
  const [role, setRole] = useState(null);
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [now, setNow] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: p } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (!p || p.role === "client") { router.push("/dashboard"); return; }
      const t = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
      setToday(t);
      setDate(t);
      setNow(Date.now());
      setRole(p.role);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, starts_at, ends_at, status, deposit_status, walk_in_label, client:profiles!client_id(full_name), services(name, deposit_rand)"
        )
        .order("starts_at", { ascending: true });
      if (error) setError(error.message);
      setBookings(data || []);
    }
    init();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!role || !date) return <p className="p-6">Loading...</p>;

  const live = bookings.filter((b) => b.status !== "cancelled");
  const countFor = (d) => live.filter((b) => dayOf(b.starts_at) === d).length;
  const strip = Array.from({ length: STRIP_BEFORE + STRIP_AFTER + 1 }, (_, i) =>
    addDays(today, i - STRIP_BEFORE)
  );

  const gridStart = new Date(`${date}T${String(START_H).padStart(2, "0")}:00:00${OFFSET}`).getTime();
  const gridEnd = new Date(`${date}T${String(END_H).padStart(2, "0")}:00:00${OFFSET}`).getTime();

  const dayItems = live
    .filter((b) => dayOf(b.starts_at) === date)
    .map((b) => {
      const start = new Date(b.starts_at).getTime();
      const end = b.ends_at ? new Date(b.ends_at).getTime() : start + 3600000;
      return { b, start, end };
    })
    .sort((a, c) => a.start - c.start);
  const { placed, total } = assignLanes(dayItems);

  const unpaid = dayItems.filter(
    ({ b }) =>
      b.status === "booked" && b.deposit_status === "pending" && b.services?.deposit_rand > 0
  ).length;
  const cancelledToday = bookings.filter(
    (b) => b.status === "cancelled" && dayOf(b.starts_at) === date
  ).length;

  const l = dayLabel(date);
  const nowTop = ((now - gridStart) / 3600000) * PX;
  const showNow = date === today && now >= gridStart && now <= gridEnd;
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="font-display mt-2 text-3xl font-bold">Daily calendar</h1>
      <p className="mb-4 text-cocoa">
        Who is booked when, by chair. To confirm deposits or move a booking, use{" "}
        <Link href="/staff" className="underline">Bookings</Link>.
      </p>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2">
        {strip.map((d) => {
          const dl = dayLabel(d);
          const on = d === date;
          const n = countFor(d);
          return (
            <button
              key={d}
              onClick={() => setDate(d)}
              className={`shrink-0 rounded-2xl border-2 px-3 py-2 text-center ${
                on ? "border-espresso bg-espresso text-cream" : "border-sand bg-white"
              }`}
            >
              <span className="block text-xs">{d === today ? "Today" : dl.weekday}</span>
              <span className="block text-lg font-bold">{dl.day}</span>
              <span className={`block text-xs ${n ? "font-semibold text-gold-dark" : "opacity-60"}`}>
                {n ? `${n} booked` : "free"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className="btn btn-outline" onClick={() => setDate(addDays(date, -1))}>← Previous</button>
        <button className="btn btn-outline" onClick={() => setDate(today)}>Today</button>
        <button className="btn btn-outline" onClick={() => setDate(addDays(date, 1))}>Next →</button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="field w-auto"
        />
      </div>

      <h2 className="font-display text-2xl font-bold">{l.full}</h2>
      <p className="mb-3 text-sm text-cocoa">
        {dayItems.length} {dayItems.length === 1 ? "booking" : "bookings"}
        {unpaid > 0 && <> · <b className="text-clay">{unpaid} deposit{unpaid === 1 ? "" : "s"} due</b></>}
        {cancelledToday > 0 && <> · {cancelledToday} cancelled</>}
      </p>
      {error && <p className="mb-3 text-clay">{error}</p>}

      <div className="card pt-6">
        <div className="relative ml-12" style={{ height: (END_H - START_H) * PX }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-sand"
              style={{ top: i * PX }}
            >
              <span className="absolute -left-12 -top-2 w-10 text-right text-xs text-cocoa">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {showNow && (
            <div
              className="absolute left-0 right-0 z-20 border-t-2 border-clay"
              style={{ top: nowTop }}
            >
              <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-clay" />
            </div>
          )}

          {placed.map(({ b, start, end, lane }) => {
            const top = (Math.max(start, gridStart) - gridStart) / 3600000 * PX;
            const bottom = (Math.min(end, gridEnd) - gridStart) / 3600000 * PX;
            const height = Math.max(bottom - top, 44);
            const name = b.client
              ? b.client.full_name || "Client"
              : b.walk_in_label || "Walk-in";
            const dep =
              b.services?.deposit_rand > 0
                ? b.deposit_status === "paid"
                  ? "Deposit paid"
                  : "Deposit due"
                : "No deposit";
            return (
              <div
                key={b.id}
                className="absolute z-10 p-0.5"
                style={{
                  top,
                  height,
                  left: `${(lane * 100) / total}%`,
                  width: `${100 / total}%`,
                }}
              >
                <div
                  className={`h-full overflow-hidden rounded-lg border-l-4 px-2 py-1 text-xs ${
                    STATUS_STYLE[b.status] || "border-gray-400 bg-gray-100"
                  }`}
                >
                  <b>{timeOf(start)}–{timeOf(end)}</b>
                  <br />
                  {name}
                  {!b.client && " (walk-in)"} · {b.services?.name}
                  <br />
                  <span className="text-cocoa">
                    {STATUS_LABEL[b.status] || b.status} · {dep}
                  </span>
                </div>
              </div>
            );
          })}

          {dayItems.length === 0 && (
            <p className="absolute left-2 top-4 text-cocoa">
              No bookings on this day.
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-cocoa">
        Overlapping bookings sit side by side. Cancelled bookings are hidden.
      </p>
    </main>
  );
}