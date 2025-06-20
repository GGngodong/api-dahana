// src/middleware/permitLetter.js
module.exports = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      errors: [{ message: "Unauthorized. User not found." }],
    });
  }

  const method = req.method.toUpperCase();
  // Allow GET & POST for all authenticated users
  if (method === "GET" || method === "POST") {
    return next();
  }

  // Other methods require ADMIN
  if (user.role !== "ADMIN") {
    return res.status(403).json({
      errors: [
        {
          message:
            "Unauthorized. You do not have the required permissions to perform this action.",
        },
      ],
    });
  }

  return next();
};
