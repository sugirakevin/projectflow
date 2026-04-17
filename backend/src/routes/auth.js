const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// GET /api/auth/registration-status
router.get('/registration-status', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    const totalUsers = await prisma.user.count();
    // Registration is open if setting is true OR if there are no users yet (need an admin)
    res.json({ isOpen: settings?.publicRegistration === true || totalUsers === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const totalUsers = await prisma.user.count();
    const isFirstUser = totalUsers === 0;
    const role = isFirstUser ? 'ADMIN' : 'USER';

    const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    if (!isFirstUser && settings?.publicRegistration !== true) {
      return res.status(403).json({ error: 'Public registration is currently disabled.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // First user is automatically approved, others need approval if public registration is on
    const isApproved = isFirstUser; 
    
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, isApproved },
    });

    if (!isApproved) {
      return res.status(201).json({ 
        message: 'Account created successfully. It is pending admin approval.',
        pendingApproval: true
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, canEditBranding: user.canEditBranding }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, canEditBranding: true, isApproved: true }
    });
    if (!user || !user.isApproved) {
      return res.status(403).json({ error: 'Account pending or disabled' });
    }
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
