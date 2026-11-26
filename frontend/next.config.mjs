/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tailwind CSS v4 through Turbopack (no PostCSS config needed)
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
