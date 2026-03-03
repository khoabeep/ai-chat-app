// POST /api/admin/set-plan
// Body: { uid: string, plan: 'free' | 'pro' }
// Header: Authorization: Bearer <ADMIN_SECRET>
import { NextResponse } from 'next/server';
import { firestoreSetUserPlan } from '@/lib/firebase';

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization') || '';
    const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

    if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: any;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { uid, plan } = body;
    if (!uid || !['free', 'pro'].includes(plan)) {
        return NextResponse.json({ error: 'uid and plan (free|pro) are required' }, { status: 400 });
    }

    await firestoreSetUserPlan(uid, plan);
    return NextResponse.json({ ok: true, uid, plan });
}
