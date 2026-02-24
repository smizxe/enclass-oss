/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        staleTimes: {
            dynamic: 60,  // Cache dynamic pages for 60s on client
            static: 300,  // Cache static pages for 5 min
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.dicebear.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

module.exports = nextConfig;
