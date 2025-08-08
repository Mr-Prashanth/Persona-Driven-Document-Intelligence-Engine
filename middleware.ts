import { NextRequest,NextResponse } from "next/server";
import {verifyJwtToken} from"./lib/auth";

export function middleware(req: NextResponse){
    const token = req.headers.get('authorization')?.split(' ')[1];
    if(!token || !verifyJwtToken(token)){
        return new NextResponse(JSON.stringify({error: 'Unauthorized'}),{status: 401,
            headers:{
                'Content-Type': 'application/json',
            }
        });
    }
    return NextResponse.next();
}
export const config = {
  matcher: ['/api/protected/:path*'], // protect only this prefix
};