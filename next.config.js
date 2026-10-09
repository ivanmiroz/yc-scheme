/** @type {import('next').NextConfig} */
const repoName = 'yc-scheme';

const nextConfig = {
    output: 'export', // статический экспорт в папку out/
    basePath: `/${repoName}`, // путь до сайта на github.io
    assetPrefix: `/${repoName}/`, // префикс для ассетов
    images: {
        unoptimized: true, // next/image не работает без сервера
    },
    trailingSlash: true, // помогает с роутингом на Pages
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
