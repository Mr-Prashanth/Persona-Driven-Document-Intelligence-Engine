import {prisma} from"../../../../lib/prisma";
import {NextResponse} from 'next/server';
import bcrypt from 'bcrypt';
import {signJwtToken} from '../../../../lib/auth';

export async function POST(req: Request){
    const body=await req.json();
    const {id,password}=body;

    if(!id || !password){
        return NextResponse.json({error:"ID and password are required"}, {status:400});
    }
    //Find user in database
    const user=await prisma.user.findUnique({where: {id}});
    if(!user){
        return NextResponse.json({error:"User not found"}, {status:404});
    }
    //Password checking
    const isPasswordCorrect=await bcrypt.compare(password,user.password);
    if(!isPasswordCorrect){
        return NextResponse.json({error: 'Invalid Credentials'},{status: 401});
    }
    //Token generation
    //inside the signjwttoken call , givec the info that is needed in client side
    const token=signJwtToken({id: user.id})
    console.log("Token generated:", token);
    return NextResponse.json({message: 'Login Successful'},{status: 200})
}