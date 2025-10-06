/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from our own proxy route
  images: {
    remotePatterns: [
      // We use <img src> not next/image for now; keep placeholder for future use
    ],
  },
};

export default nextConfig;
