import { NextResponse } from 'next/server';
import { firebaseRegister } from '@/lib/firebase';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const result = await firebaseRegister(email, password);

        const response = NextResponse.json({ ok: true, email: result.email });
        response.cookies.set('auth_token', result.idToken, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });
        response.cookies.set('user_uid', result.localId, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });
        return response;
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
}
