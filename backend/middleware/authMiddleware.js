/*
 * Authentication middleware used to protect private API routes.
 * It reads and verifies the JWT token sent by the frontend.
 * The authenticated user's ID is attached to the request object.
 * Requests with missing or invalid tokens are rejected.
 */

const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Check Authorization header
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Attach user information
        req.user = {
            userId: decoded.userId
        };

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = protect;
