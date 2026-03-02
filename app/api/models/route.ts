import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
