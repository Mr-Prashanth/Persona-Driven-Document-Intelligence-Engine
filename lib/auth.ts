import jwt from 'jsonwebtoken';

const JWT_SECRET=process.env.JWT_SECRET as string;

//In payload we can give as many info which needd to be tokenized in an object notation

export function signJwtToken(payload: object){
    return jwt.sign(payload,JWT_SECRET,{expiresIn: '7d'})
}

export function verifyJwtToken(token: string){
    try{
        return jwt.verify(token,JWT_SECRET)
    }catch(error){
        return null;
    }
}
