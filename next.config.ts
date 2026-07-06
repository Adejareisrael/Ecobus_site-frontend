import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  // firebase-admin's auth module pulls in jwks-rsa, which does a CommonJS
  // require() of jose's ESM-only build. Turbopack's production bundler tries
  // to statically bundle that and fails with ERR_REQUIRE_ESM; leaving the
  // package external lets Node's own require/import interop handle it at
  // runtime instead, which works fine.
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    // apis.google.com serves the Google API loader script Firebase Auth's
    // Google sign-in popup injects at runtime; without it the popup fails
    // immediately with a CSP violation before it can even open.
    const scriptSrc =
      process.env.NODE_ENV === "development"
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;"
        : "script-src 'self' 'unsafe-inline' https://apis.google.com;";

    const productionHeaders =
      process.env.NODE_ENV === "production"
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : [];

    return [
      {
        source: "/(.*)",
        headers: [
          ...productionHeaders,
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              scriptSrc,
              "style-src 'self' 'unsafe-inline';",
              "img-src 'self' data: blob: https:;",
              "connect-src 'self' https://api.paystack.co https://apis.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;",
              // Firebase Auth's popup sign-in flow loads a hidden iframe on
              // <project>.firebaseapp.com (its default authDomain) to relay
              // the result back from the Google OAuth popup.
              "frame-src https://*.firebaseapp.com;",
              "frame-ancestors 'none';",
              "base-uri 'self';",
              "form-action 'self' https://*.paystack.com;",
            ].join(" "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
