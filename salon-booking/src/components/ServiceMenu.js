"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import StyleThumb from "./StyleThumb";

function fmtDur(min) {
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

const GROUPS = [
  { title: "Braids and dreads", note: "Long-lasting styles", test: (s) => s.duration_minutes >= 180 },
  { title: "Hairstyles", note: "About 1 hour", test: (s) => s.duration_minutes > 40 && s.duration_minutes < 180 },
  { title: "Relaxers, wash and treatments", note: "Quick care", test: (s) => s.duration_minutes <= 40 },
];

export default function ServiceMenu() {
  const [services, setServices] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("services")
        .select("id, name, price_rand, duration_minutes")
        .eq("active", true)
        .order("id");
      if (!cancelled) setServices(data || []);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (services === null) return <p className="text-cocoa">Loading services...</p>;
  if (services.length === 0) return <p className="text-cocoa">Services coming soon.</p>;

  return (
    <div className="flex flex-col gap-5">
      {GROUPS.map((g) => {
        const items = services.filter(g.test);
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="card">
            <h3 className="font-display text-xl font-semibold">{g.title}</h3>
            <p className="mb-3 text-sm text-cocoa">{g.note}</p>
            <ul className="divide-y divide-sand">
              {items.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <StyleThumb name={s.name} size={56} />
                  <span className="min-w-0 flex-1">
                    {s.name}
                    <span className="block text-xs text-cocoa">{fmtDur(s.duration_minutes)}</span>
                  </span>
                  <span className="font-semibold text-gold-dark">R{s.price_rand}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}