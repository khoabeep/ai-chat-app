// Firebase Auth via REST API (no npm needed)
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

const SIGN_UP_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
const SIGN_IN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

// ── Firestore REST API (#2/#12) ───────────────────────────────────────────────
export async function firestoreGet(docPath: string, idToken: string): Promise<any> {
    const url = `${FIRESTORE_URL}/${docPath}`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (!res.ok) return null;
    return res.json();
}

export async function firestoreSet(docPath: string, fields: Record<string, string>, idToken: string): Promise<void> {
    const url = `${FIRESTORE_URL}/${docPath}`;
    const firestoreFields: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
        firestoreFields[k] = { stringValue: v };
    }
    await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: firestoreFields }),
    });
}

// ── User Plan management (no auth — requires open Firestore rules for users/) ─
export async function firestoreGetUserPlan(uid: string): Promise<'free' | 'pro'> {
    try {
        const url = `${FIRESTORE_URL}/users/${uid}`;
        const res = await fetch(url);
        if (!res.ok) return 'free';
        const doc = await res.json();
        const plan = doc?.fields?.plan?.stringValue;
        return plan === 'pro' ? 'pro' : 'free';
    } catch {
        return 'free';
    }
}

export async function firestoreCreateUserDoc(uid: string, email: string): Promise<void> {
    const url = `${FIRESTORE_URL}/users/${uid}`;
    await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fields: {
                plan: { stringValue: 'free' },
                email: { stringValue: email },
                createdAt: { stringValue: new Date().toISOString() },
            },
        }),
    });
}

export async function firestoreSetUserPlan(uid: string, plan: string): Promise<void> {
    const url = `${FIRESTORE_URL}/users/${uid}?updateMask.fieldPaths=plan`;
    await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { plan: { stringValue: plan } } }),
    });
}
