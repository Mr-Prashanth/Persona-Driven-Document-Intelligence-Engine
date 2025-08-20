const prisma= require('../config/db');

exports.profile = async(req,res,next) => {
    try {
        const userId = req.user.id; 
        const user = await prisma.user.findUnique({
            where: { userId: userId },
            select: {
                id: true,
                name: true,
                phoneNumber: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}