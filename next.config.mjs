/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/prices",
        destination: "/pricing",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

