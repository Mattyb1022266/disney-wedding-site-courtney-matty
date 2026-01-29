export async function onRequestGet({ params, env }) {
  const bucket = env.WEDDING_PHOTOS;
  if (!bucket) return new Response('Missing R2 binding WEDDING_PHOTOS', { status: 500 });

  const key = params.key;
  const obj = await bucket.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
}
