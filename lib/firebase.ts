// Firebase Auth via REST API (no npm needed)
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;

const SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

export type AuthResult = {
    idToken: string;
    email: string;
    displayName?: string;
    localId: string;
};

export async function firebaseRegister(email: string, password: string): Promise<AuthResult> {
    const res = await fetch(SIGN_UP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) {
        const msg = mapFirebaseError(data?.error?.message);
        throw new Error(msg);
    }
    return data as AuthResult;
}

export async function firebaseLogin(email: string, password: string): Promise<AuthResult> {
    const res = await fetch(SIGN_IN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const data = await res.json();
    if (!res.ok) {
        const msg = mapFirebaseError(data?.error?.message);
        throw new Error(msg);
    }
    return data as AuthResult;
}

function mapFirebaseError(code: string): string {
    const map: Record<string, string> = {
        'EMAIL_EXISTS': 'Email này đã được đăng ký.',
        'INVALID_EMAIL': 'Email không hợp lệ.',
        'WEAK_PASSWORD : Password should be at least 6 characters': 'Mật khẩu phải ít nhất 6 ký tự.',
        'EMAIL_NOT_FOUND': 'Email chưa được đăng ký.',
        'INVALID_PASSWORD': 'Mật khẩu không đúng.',
        'USER_DISABLED': 'Tài khoản đã bị khóa.',
        'INVALID_LOGIN_CREDENTIALS': 'Email hoặc mật khẩu không đúng.',
        'TOO_MANY_ATTEMPTS_TRY_LATER': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
    };
    return map[code] || `Lỗi: ${code}`;
}
