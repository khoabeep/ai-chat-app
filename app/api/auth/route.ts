import { NextResponse } from 'next/server';
import { firebaseLogin, firestoreGetUserPlan } from '@/lib/firebase';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const result = await firebaseLogin(email, password);

        // Fetch plan from Firestore (default 'free' if doc doesn't exist)
        const plan = await firestoreGetUserPlan(result.localId);

        const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 7 };
        const response = NextResponse.json({ ok: true, email: result.email, plan });
        response.cookies.set('auth_token', result.idToken, COOKIE_OPTS);
        response.cookies.set('user_uid', result.localId, COOKIE_OPTS);
        response.cookies.set('user_plan', plan, COOKIE_OPTS);
        return response;
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.delete('auth_token');
    response.cookies.delete('user_uid');
    response.cookies.delete('user_plan');
    return response;
}
