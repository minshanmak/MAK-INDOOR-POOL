/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
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
