const IMAGES = {
    "Straight back (short)": "style-10.png",
  "Straight back (long)": "style-10.png",
  "Free hand": "style-5.jpg",
  "Cornrows": "style-7.jpg",
  "Popcorn":"style-8.jpg",
  "Dry pam":"style-2.jpg",
  "Straight up (short)": "style-6.jpg",
  "Straight up (long)": "style-6.jpg",
  "Knotless & twist (long)": "style-11.png",
  "Knotless & twist (short)": "style-11.png",
  "Dreads (start)": "style-12.png"
};

export function imageFor(name) {
  return IMAGES[name] ? `/gallery/${IMAGES[name]}` : null;
}