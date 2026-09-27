/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // React <ViewTransition> integration: powers the card-to-hero morph.
    viewTransition: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
