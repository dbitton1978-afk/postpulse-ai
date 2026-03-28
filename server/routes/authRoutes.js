import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const users = [];

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

router.post("/register", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Missing email or password"
    });
  }

  const exists = users.find((u) => u.email === email);

  if (exists) {
    return res.status(400).json({
      message: "User already exists"
    });
  }

  const newUser = {
    id: Date.now().toString(),
    email,
    password
  };

  users.push(newUser);

  const token = generateToken(newUser);

  return res.json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email
    }
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      message: "Missing email or password"
    });
  }

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  const token = generateToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email
    }
  });
});

export default router;
