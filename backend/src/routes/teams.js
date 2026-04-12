const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Any authenticated user can get teams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: { users: { select: { id: true, name: true, email: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(teams);
  } catch (err) {
    console.error('Fetch teams error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only: create a team
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Team name is required' });

    const team = await prisma.team.create({
      data: { name: name.trim() },
      include: { users: true }
    });
    res.status(201).json(team);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Team name already exists' });
    console.error('Create team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only: delete a team
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.team.delete({ where: { id } });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin only: update team users
router.put('/:id/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body; // Array of user ids

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        users: {
          set: userIds.map(uid => ({ id: uid }))
        }
      },
      include: { users: { select: { id: true, name: true, email: true } } }
    });
    res.json(team);
  } catch (err) {
    console.error('Update team users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
