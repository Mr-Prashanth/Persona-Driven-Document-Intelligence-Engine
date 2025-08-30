const prisma= require('../config/db');

exports.profile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    const user = await prisma.user.findUnique({
      where: { userId }, // now it's a number
      select: { userId: true, name: true, phoneNumber: true, email: true }
    });
    console.log(user)

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
