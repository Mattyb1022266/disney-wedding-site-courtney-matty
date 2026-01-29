export async function onRequest(context) {
  // Simple CORS (same-origin is fine, but this helps local tooling)
  const res = await context.next();
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, x-admin-passcode');
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
