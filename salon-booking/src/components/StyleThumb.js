import Image from "next/image";
import { imageFor } from "../lib/styleImages";

export default function StyleThumb({ name, size = 56 }) {
  const src = imageFor(name);
  const box = { width: size, height: size };
  if (!src) {
    return (
      <div
        style={box}
        className="font-display flex shrink-0 items-center justify-center rounded-xl bg-espresso text-xl font-bold text-gold"
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div style={box} className="relative shrink-0 overflow-hidden rounded-xl bg-sand">
      <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
    </div>
  );
}