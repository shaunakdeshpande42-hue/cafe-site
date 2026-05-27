import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The hero photo on page.tsx uses quality 90; Next 16 requires that
    // value to be declared. Including the defaults plus 90.
    qualities: [70, 75, 90],
    // menu_items.image_url and events.image_url are external URLs typed
    // by admin staff. Allow common image-hosting domains. Tighten this
    // list further once we standardise on a single host (e.g. Cloudinary).
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.imgix.net" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
};

export default nextConfig;
