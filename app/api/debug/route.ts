export async function GET() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        return Response.json({ ok: false, error: 'GEMINI_API_KEY not found in environment' });
    }

    // First, list available models for this key
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    // Find models that support generateContent
    const availableModels = listData.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        ?.map((m: any) => m.name)
        || [];

    // Try first available model
    const testModel = availableModels[0]?.replace('models/', '') || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${testModel}:generateContent?key=${key}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with just: OK' }] }]
        })
    });

    const data = await res.json();
    return Response.json({
        ok: res.ok,
        status: res.status,
        keyPrefix: key.slice(0, 12) + '...',
        testedModel: testModel,
        availableModels,
        data
    });
}
