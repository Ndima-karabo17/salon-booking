import Image from "next/image";

const WORK = [
  { file: "style-1.jpg" },
  { file: "style-2.jpg"},
  { file: "style-3.jpg" },
  { file: "style-4.jpg"},
  { file: "style-5.jpg" },
  { file: "style-6.jpg"},
  { file: "style-7.jpg"},
  { file: "style-8.jpg"},
  { file: "style-9.jpg"},
];

export default function Gallery() {
  if (WORK.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {WORK.map((w) => (
        <figure key={w.file} className="overflow-hidden rounded-2xl border border-sand bg-white">
          <div className="relative aspect-[3/4]">
            <Image
              src={`/gallery/${w.file}`}
              alt={w.caption}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <figcaption className="px-3 py-2 text-sm text-cocoa">{w.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}