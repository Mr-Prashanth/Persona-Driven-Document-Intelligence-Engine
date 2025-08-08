import { NextRequest,NextResponse } from "next/server";
import {verifyJwtToken} from "../../../../lib/auth"

export async function GET(req: NextRequest){
    try{
        const authHeader = req.headers.get('authorization');
        const token=authHeader?.split(' ')[1];

        if(!token){
            return NextResponse.json({error:"Missing Token"}, {status: 401});
        }
        const decodedToken = verifyJwtToken(token);
        if(!decodedToken){
            return NextResponse.json({error:'Invalid Token'}, {status: 401});
        }
        return NextResponse.json({userId: (decodedToken as any).id});
    }catch(error){
        return NextResponse.json({error: "Unorthorized"}, {status: 401});
    }
}