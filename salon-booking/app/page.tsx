import Link from "next/link";
import ServiceMenu from "../src/components/ServiceMenu";
import Gallery from "../src/components/Gallery";

const SALON_NAME = "Sbongile's Hair Salon";
const ADDRESS = "448 Bo-Okelo St, Seshego-A, Polokwane, 0742";
const PHONE = ""; // add the salon's number only with the owner's permission

const mapQuery = encodeURIComponent(ADDRESS + ", South Africa");
const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

const STEPS = [
  ["Choose", "Pick your style, date and start time."],
  ["Secure", "Pay a small non-refundable deposit by cash or transfer to hold your slot."],
  ["Relax", "We confirm your deposit and your chair is waiting."],
];

export default function Home() {
  return (
    <main>
      <section className="bg-espresso text-cream">
        <div className="mx-auto max-w-xl px-6 py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
            Seshego, Polokwane
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight">{SALON_NAME}</h1>
          <p className="mt-4 text-lg text-sand">
            Braids, styles and hair care. Book your chair in minutes and walk in
            knowing your slot is yours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="btn btn-gold">Book an appointment</Link>
            <a href="#services" className="btn btn-outline-light">See styles and prices</a>
          </div>
          <p className="mt-6 text-sm text-sand">Open every day, 07:00 to 19:00</p>
        </div>
      </section>

      <section id="work" className="mx-auto max-w-xl px-6 pt-12">
        <h2 className="font-display text-3xl font-bold">Our work</h2>
        <p className="mb-6 mt-1 text-cocoa">A few styles from the chair. Pick one and book it.</p>
        <Gallery />
        <Link href="/book" className="btn btn-gold mt-6 w-full">Book your style</Link>
      </section>

      <section id="services" className="mx-auto max-w-xl px-6 py-12">
        <h2 className="font-display text-3xl font-bold">Styles and prices</h2>
        <p className="mb-6 mt-1 text-cocoa">Prices and times as set by the salon.</p>
        <ServiceMenu />
        <Link href="/book" className="btn btn-dark mt-6 w-full">Book now</Link>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-xl px-6 py-12">
          <h2 className="font-display text-3xl font-bold">How booking works</h2>
          <ol className="mt-6 flex flex-col gap-4">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-bold text-espresso">
                  {i + 1}
                </span>
                <span>
                  <b>{title}</b>
                  <br />
                  <span className="text-cocoa">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-12">
        <h2 className="font-display text-3xl font-bold">Find us</h2>
        <p className="mt-2">{ADDRESS}</p>
        <p className="text-cocoa">Open every day, 07:00 to 19:00</p>
        {PHONE && <p className="text-cocoa">Phone: {PHONE}</p>}
        <iframe
          title="Salon location map"
          src={mapEmbed}
          className="mt-4 h-64 w-full rounded-2xl border border-sand"
          loading="lazy"
        />
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline mt-4 w-full"
        >
          Open in Google Maps
        </a>
      </section>

      <footer className="bg-espresso px-6 py-8 text-center text-xs text-sand">
        Prototype built for the Samsung Innovation Internship assignment. All
        client data in this app is made up.
        <br />
        <Link href="/login" className="mt-2 inline-block text-gold underline">
          Log in
        </Link>
      </footer>
    </main>
  );
}