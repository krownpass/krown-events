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
                destination:
                    process.env.NODE_ENV === "production"
                        ? "https://api.krownpass.com/api/events/:path*"
                        : "http://localhost:4000/api/events/:path*",
            },
            {
                source: "/api/proxy/bookings/:path*",
                destination:
                    process.env.NODE_ENV === "production"
                        ? "https://api.krownpass.com/api/bookings/:path*"
                        : "http://localhost:4000/api/bookings/:path*",
            },
        ];
    },
};

export default nextConfig;
