// #2/#12: Firestore conversation sync via REST API
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { firestoreGet, firestoreSet } from '@/lib/firebase';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const uid = cookieStore.get('user_uid')?.value;
    if (!token || !uid) return Response.json({ conversations: [] });

    try {
        const data = await firestoreGet(`conversations/${uid}`, token);
        const raw = data?.fields?.data?.stringValue;
        return Response.json({ conversations: raw ? JSON.parse(raw) : [] });
    } catch (e) {
        console.error('Firestore GET error:', e);
        return Response.json({ conversations: [] });
    }
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const uid = cookieStore.get('user_uid')?.value;
    if (!token || !uid) return Response.json({ ok: false });

    try {
        const { conversations } = await req.json();
        await firestoreSet(`conversations/${uid}`, { data: JSON.stringify(conversations) }, token);
        return Response.json({ ok: true });
    } catch (e) {
        console.error('Firestore POST error:', e);
        return Response.json({ ok: false });
    }
}
