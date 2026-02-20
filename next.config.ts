import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        domains: ["images.unsplash.com"],
    },

    experimental: {
        serverActions: {
            bodySizeLimit: "2mb",
        },
    },

    reactCompiler: true,

    async rewrites() {
        return [
            {
                source: "/api/proxy/events/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/events/:path*`,
            },
            {
                source: "/api/proxy/bookings/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/bookings/:path*`,
            },
        ];
    },
};

export default nextConfig;
