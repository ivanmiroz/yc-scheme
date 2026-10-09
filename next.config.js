/** @type {import('next').NextConfig} */
const repoName = 'yc-scheme';

const isProd = process.env.NODE_ENV === 'production';
const isGithubPages = process.env.GITHUB_PAGES === 'true' || isProd;

const nextConfig = {
    output: 'export',
    basePath: isGithubPages ? `/${repoName}` : '',
    assetPrefix: isGithubPages ? `/${repoName}/` : '',
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
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
