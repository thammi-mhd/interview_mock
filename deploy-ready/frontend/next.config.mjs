/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "media-src 'self' blob:",
              `connect-src 'self' ${backendUrl}`,
              "worker-src 'self' blob:",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
