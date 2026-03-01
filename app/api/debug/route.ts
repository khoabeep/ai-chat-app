export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return Response.json({ ok: false, error: 'GEMINI_API_KEY not found in environment' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Hello, reply with just: OK' }] }]
        })
    });

    const data = await res.json();
    return Response.json({ ok: res.ok, status: res.status, keyPrefix: key.slice(0, 12) + '...', data });
}
