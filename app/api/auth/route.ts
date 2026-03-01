import { NextResponse } from 'next/server';
import { firebaseLogin } from '@/lib/firebase';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const result = await firebaseLogin(email, password);

        const response = NextResponse.json({ ok: true, email: result.email });
        // Store the Firebase idToken in a secure cookie (1 hour expiry)
        response.cookies.set('auth_token', result.idToken, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });
        return response;
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err.message }, { status: 401 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true });
    response.cookies.delete('auth_token');
    return response;
}
