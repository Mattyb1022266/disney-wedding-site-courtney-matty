const KEY = 'suggestions';

export async function onRequestGet({ env }) {
  const kv = env.WEDDING_KV;
  if (!kv) return json({ suggestions: [] });

  const raw = await kv.get(KEY);
  const suggestions = raw ? JSON.parse(raw) : [];
  return json({ suggestions });
}

export async function onRequestPost({ request, env }) {
  const kv = env.WEDDING_KV;
  if (!kv) return new Response('Missing KV binding WEDDING_KV', { status: 500 });

  const hdr = request.headers.get('x-admin-passcode') || '';
  const admin = env.ADMIN_PASSCODE || '';

  // Allow a "SESSION" shortcut for users who already "unlocked" the UI locally.
  // In production, you can remove this if you want stricter security.
  const ok = (hdr && admin && hdr === admin) || hdr === 'SESSION';

  if (!ok) return new Response('Unauthorized', { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.suggestions)) return new Response('Invalid payload', { status: 400 });

  await kv.put(KEY, JSON.stringify(body.suggestions));
  return json({ ok: true });
}

function json(obj, status = 200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
