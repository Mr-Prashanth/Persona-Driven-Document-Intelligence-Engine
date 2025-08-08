import { NextResponse } from "next/server";

export async  function POST(req: Request){
    try{
        const body=await req.json();
        const {email,password}=body;

        if(!email || !password){
            return NextResponse.json({error: "Missing Fields"},{status: 400});
        }
        else{
            return NextResponse.json({message: "all fields present"})
        }
    }catch(error){
            return NextResponse.json({messsage:error});
    }
}