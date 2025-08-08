import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, password, name, phonenumber } = body;

    if (!id || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Checking if user id already present
    
    const existingUser=await prisma.user.findUnique({where: {id}});
    if(existingUser){
        return NextResponse.json({ error: 'User ID already exists' }, { status: 400 });
    }

    //Password hashing

    const hashedPassword=await bcrypt.hash(password,10);

    //User creation

    const user = await prisma.user.create({
      data: {
        id,
        password: hashedPassword,
        name,
        phoneNumber: phonenumber,
      },
    });

    return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'User creation failed', details: error.message },
      { status: 500 }
    );
  }
}
