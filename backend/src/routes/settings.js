const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, brandingMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/settings - Public
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: { id: 'default', themeColor: '#7c3aed' }
      });
    }
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings - Protected by branching permissions
router.put('/', authMiddleware, brandingMiddleware, async (req, res) => {
  try {
    const { themeColor, bgUrl, logoUrl } = req.body;
    const settings = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: { themeColor, bgUrl, logoUrl },
      create: { id: 'default', themeColor: themeColor || '#7c3aed', bgUrl, logoUrl }
    });
    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/settings/security - Protected by admin role
router.put('/security', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { publicRegistration } = req.body;
    const settings = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: { publicRegistration },
      create: { id: 'default', publicRegistration }
    });
    res.json(settings);
  } catch (err) {
    console.error('Update security settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
