/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Keep builds unblocked on internal tool; run `npm run lint` separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
