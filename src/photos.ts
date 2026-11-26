export type PhotoId = "m187311853" | "m61713028" | "m201752739" | "m61713103" | "m189498721" | "m61714648" | "f198740925" | "f142209460";

export interface Photo {
  src: string;
  small: string;
  srcset: string;
  width: number;
  height: number;
  position: string;
}

export const PHOTOS: Record<PhotoId, Photo> = {
  m187311853: {
    src: "/photos/photo-m187311853-1200.webp",
    small: "/photos/photo-m187311853-1200.webp",
    srcset: "/photos/photo-m187311853-1200.webp 1200w",
    width: 1200,
    height: 800,
    position: "62% 50%",
  },
  m61713028: {
    src: "/photos/photo-m61713028-960.jpg",
    small: "/photos/photo-m61713028-500.jpg",
    srcset: "/photos/photo-m61713028-500.jpg 500w, /photos/photo-m61713028-960.jpg 960w",
    width: 960,
    height: 640,
    position: "62% 50%",
  },
  m201752739: {
    src: "/photos/photo-m201752739-960.jpg",
    small: "/photos/photo-m201752739-500.jpg",
    srcset: "/photos/photo-m201752739-500.jpg 500w, /photos/photo-m201752739-960.jpg 960w",
    width: 960,
    height: 1433,
    position: "45% 50%",
  },
  m61713103: {
    src: "/photos/photo-m61713103-960.jpg",
    small: "/photos/photo-m61713103-500.jpg",
    srcset: "/photos/photo-m61713103-500.jpg 500w, /photos/photo-m61713103-960.jpg 960w",
    width: 960,
    height: 640,
    position: "58% 45%",
  },
  m189498721: {
    src: "/photos/photo-m189498721-960.jpg",
    small: "/photos/photo-m189498721-500.jpg",
    srcset: "/photos/photo-m189498721-500.jpg 500w, /photos/photo-m189498721-960.jpg 960w",
    width: 960,
    height: 640,
    position: "40% 60%",
  },
  m61714648: {
    src: "/photos/photo-m61714648-500.jpg",
    small: "/photos/photo-m61714648-500.jpg",
    srcset: "/photos/photo-m61714648-500.jpg 500w",
    width: 500,
    height: 746,
    position: "60% 70%",
  },
  f198740925: {
    src: "/photos/photo-f198740925-500.jpg",
    small: "/photos/photo-f198740925-500.jpg",
    srcset: "/photos/photo-f198740925-500.jpg 500w",
    width: 500,
    height: 373,
    position: "50% 40%",
  },
  f142209460: {
    src: "/photos/photo-f142209460-500.jpg",
    small: "/photos/photo-f142209460-500.jpg",
    srcset: "/photos/photo-f142209460-500.jpg 500w",
    width: 500,
    height: 325,
    position: "50% 50%",
  },
};

export function photo(id: string): Photo {
  return PHOTOS[id as PhotoId] ?? PHOTOS.m61713028;
}

export function thumbs(id: string) {
  const key = id in PHOTOS ? id : "m61713028";
  return {
    src: `/photos/photo-${key}-140.webp`,
    srcset: [80, 140, 200, 320].map((width) => `/photos/photo-${key}-${width}.webp ${width}w`).join(", "),
  };
}
