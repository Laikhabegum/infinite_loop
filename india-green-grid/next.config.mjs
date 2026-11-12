/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Lightfall background releases its WebGL context when it unmounts.
  // Strict Mode's development-only double mount would leave it with a dead
  // canvas, so it is off. Production builds are unaffected either way.
  reactStrictMode: false,
  // Ship the cleaned data snapshots with the server bundle when deployed.
  outputFileTracingIncludes: { '/**': ['./data/clean/**', './data/jobs.json'] }
};
export default nextConfig;
