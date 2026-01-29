export async function onRequestGet({ env }) {
  const kv = env.WEDDING_KV;
  if (!kv) return json({ photos: [] });

  const raw = await kv.get('photos');
  const photos = raw ? JSON.parse(raw) : [];
  return json({ photos });
}

function json(obj, status = 200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
