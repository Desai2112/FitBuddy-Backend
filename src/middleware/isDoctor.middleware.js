import User from "../Models/User.js";

const isDoctor = async (req, res, next) => {
    if (req.session && req.session.userId) {
        const userRole = await User.findById(req.session.userId).select('role');
        if (userRole.role === 'doctor') {
            next();
        }
    } else {
        res.status(401).json({ message: "Unauthorized", success: false });
    }
};

export default isDoctor;
