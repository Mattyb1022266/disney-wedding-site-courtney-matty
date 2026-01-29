const MAX_FILES = 20;

export async function onRequestPost({ request, env }) {
  const bucket = env.WEDDING_PHOTOS;
  const kv = env.WEDDING_KV;

  if (!bucket || !kv) {
    return new Response('Missing R2/KV bindings. Configure WEDDING_PHOTOS (R2) and WEDDING_KV (KV).', { status: 500 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return new Response('Expected multipart/form-data', { status: 400 });
  }

  const form = await request.formData();
  const files = form.getAll('photos').filter(Boolean);

  if (!files.length) return json({ ok: true, uploaded: 0 });
  if (files.length > MAX_FILES) return new Response(`Too many files (max ${MAX_FILES} per upload).`, { status: 400 });

  const raw = await kv.get('photos');
  const existing = raw ? JSON.parse(raw) : [];

  const uploaded = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    if (!file.type.startsWith('image/')) continue;

    const id = crypto.randomUUID();
    const safeName = (file.name || 'photo').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
    const key = `${Date.now()}_${id}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const url = `/api/photos/file/${encodeURIComponent(key)}`;
    uploaded.push({
      id,
      key,
      url,
      name: file.name || safeName,
      uploadedAt: new Date().toISOString()
    });
  }

  const next = [...uploaded, ...existing].slice(0, 500);
  await kv.put('photos', JSON.stringify(next));

  return json({ ok: true, uploaded: uploaded.length, photos: next });
}

function json(obj, status = 200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
