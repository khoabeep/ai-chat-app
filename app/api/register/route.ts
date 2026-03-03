import { NextResponse } from 'next/server';
import { firebaseRegister, firestoreCreateUserDoc } from '@/lib/firebase';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const result = await firebaseRegister(email, password);

        // Create user doc in Firestore with plan='free'
        await firestoreCreateUserDoc(result.localId, result.email);
        const plan = 'free';

        const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 7 };
        const response = NextResponse.json({ ok: true, email: result.email, plan });
        response.cookies.set('auth_token', result.idToken, COOKIE_OPTS);
        response.cookies.set('user_uid', result.localId, COOKIE_OPTS);
        response.cookies.set('user_plan', plan, COOKIE_OPTS);
        return response;
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
}
