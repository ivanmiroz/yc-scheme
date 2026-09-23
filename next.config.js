/** @type {import('next').NextConfig} */
const nextConfig = {
    output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
    crossOrigin: process.env.STATIC_EXPORT === 'true' ? 'anonymous' : undefined,
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
};

module.exports = nextConfig;
