export async function GET() {
  return new Response(
    `User-agent: *
Allow: /

Sitemap: https://bto-ballot-tracker.vercel.app/sitemap.xml
`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
