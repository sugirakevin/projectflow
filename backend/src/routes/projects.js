const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// List all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { tasks: true }
        },
        createdBy: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Add overdue tasks count to each project
    // Note: We do this manually since Prisma count doesn't support complex conditions directly in the _count block easily
    const projectIds = projects.map(p => p.id);
    const overdueCounts = await prisma.task.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
        overdueFlag: true,
        isClosed: false
      },
      _count: true
    });

    const overdueMap = {};
    overdueCounts.forEach(c => {
      overdueMap[c.projectId] = c._count;
    });

    const result = projects.map(p => ({
      ...p,
      overdueCount: overdueMap[p.id] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Fetch projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single project
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Fetch project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'ACTIVE',
        deadline: deadline ? new Date(deadline) : null,
        createdById: req.user.id
      },
      include: {
        createdBy: { select: { name: true } }
      }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        status,
        deadline: deadline ? new Date(deadline) : null
      },
      include: {
        createdBy: { select: { name: true } }
      }
    });
    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can delete projects' });
  }
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (err) {
    console.error('Delete project error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
