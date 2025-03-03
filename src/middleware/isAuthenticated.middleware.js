
const isAuthenticated = async (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(401).json({ message: "Unauthorized", success: false });
    }
};

export default isAuthenticated;
