const SALON_NAME = "Your Salon Name"; // placeholder: use the real name only if the owner agrees
const ADDRESS = "Your street address, Your area, Johannesburg"; // placeholder
const PHONE = "000 000 0000"; // placeholder: use the salon's number only with permission

const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}&output=embed`;
const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-3xl font-bold">{SALON_NAME}</h1>
      <p className="mt-1 text-gray-600">Braiding and hair care</p>

      <div className="mt-6 flex flex-col gap-3">
        <a href="/book" className="rounded bg-black p-3 text-center text-white">
          Book an appointment
        </a>
        <a href="/login" className="rounded border p-3 text-center">
          Log in / Create account
        </a>
      </div>

      <h2 className="mb-2 mt-8 text-xl font-bold">How booking works</h2>
      <ol className="list-decimal pl-5">
        <li>Choose your style, date and time.</li>
        <li>Pay a small deposit by transfer or cash to secure your slot.</li>
        <li>The salon confirms your deposit, and your slot is held for you.</li>
      </ol>

      <h2 className="mb-2 mt-8 text-xl font-bold">Find us</h2>
      <p>{ADDRESS}</p>
      <p>Open from 8:00 every day. Closing time depends on clients.</p>
      <p className="mb-3">Phone: {PHONE}</p>
      <iframe
        title="Salon location map"
        src={mapEmbed}
        className="h-64 w-full rounded border"
        loading="lazy"
      />
      <a href={mapLink} className="mt-2 inline-block underline" target="_blank" rel="noreferrer">
        Open in Google Maps
      </a>

      <p className="mt-10 text-xs text-gray-500">
        Prototype for the Samsung Innovation Internship assignment. All data in
        this app is made up.
      </p>
    </main>
  );
}