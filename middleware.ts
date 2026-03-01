import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
    // Auth is optional — anyone can access the chat without logging in
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
