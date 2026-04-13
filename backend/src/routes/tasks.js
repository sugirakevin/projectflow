const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { calculateOverdue } = require('../services/overdue');
const { runNotificationCheck } = require('../services/cron');
const { sendTaskUpdateEmail, sendCommentEmail, sendTaskAssignedEmail, sendTeamAssignmentEmail } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

// All task routes require authentication
router.use(authMiddleware);

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  group: z.string().optional().default(''),
  description: z.string().optional().default(''),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  devStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']).default('NOT_STARTED'),
  testStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED']).default('NOT_STARTED'),
  deadline: z.string().refine(d => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  notes: z.string().optional().default(''),
  assignedUserId: z.string().optional().nullable(),
  assignedTeamId: z.string().optional().nullable(),
  projectId: z.string().min(1, 'Project is required'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  group: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  devStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  testStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED']).optional(),
  deadline: z.string().refine(d => !isNaN(Date.parse(d))).optional(),
  notes: z.string().optional(),
  assignedUserId: z.string().optional().nullable(),
  assignedTeamId: z.string().optional().nullable(),
  projectId: z.string().optional(),
});

// GET /api/tasks/summary
router.get('/summary', async (req, res) => {
  try {
    const [total, overdue, closed] = await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { overdueFlag: true } }),
      prisma.task.count({ where: { isClosed: true } }),
    ]);

    const byPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: { priority: true },
    });

    const byDevStatus = await prisma.task.groupBy({
      by: ['devStatus'],
      _count: { devStatus: true },
    });

    res.json({
      total,
      overdue,
      closed,
      byPriority: byPriority.map(r => ({ priority: r.priority, count: r._count.priority })),
      byDevStatus: byDevStatus.map(r => ({ status: r.devStatus, count: r._count.devStatus })),
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks — list with filters
router.get('/', async (req, res) => {
  try {
    const { priority, devStatus, testStatus, assignedUserId, overdue, search, projectId } = req.query;
    const where = {};

    if (priority) where.priority = priority;
    if (devStatus) where.devStatus = devStatus;
    if (testStatus) where.testStatus = testStatus;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (projectId) where.projectId = projectId;
    if (overdue === 'true') where.overdueFlag = true;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const tasks = await prisma.task.findMany({
      where,
      include: { assignedUser: { select: { id: true, name: true, email: true } } },
      orderBy: { deadline: 'asc' },
    });

    res.json(tasks);
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/users — list all users (for assign dropdown)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id — get one task with comments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, imageUrl } = req.body;
    if (!text?.trim() && !imageUrl) {
      return res.status(400).json({ error: 'Comment must have text or an image' });
    }

    const task = await prisma.task.findUnique({ 
      where: { id },
      include: { 
        assignedUser: { select: { id: true, name: true, email: true } },
        assignedTeam: { include: { users: { select: { id: true, name: true, email: true } } } }
      }
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const comment = await prisma.comment.create({
      data: {
        text: text || '',
        imageUrl: imageUrl || null,
        taskId: id,
        userId: req.user.id,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Collect all user IDs to notify (team members + assigned user, excluding commenter)
    const notifyUserIds = new Set();
    if (task.assignedTeam?.users) {
      task.assignedTeam.users
        .filter(u => u.id !== req.user.id)
        .forEach(u => notifyUserIds.add(u.id));
    }
    if (task.assignedUserId && task.assignedUserId !== req.user.id) {
      notifyUserIds.add(task.assignedUserId);
    }

    if (notifyUserIds.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(notifyUserIds).map(userId => ({
          userId,
          title: `New Comment: ${task.title}`,
          message: `${req.user.name} commented: "${(text || '').substring(0, 50)}${(text || '').length > 50 ? '...' : ''}"`,
          taskId: task.id
        }))
      });
      // Email the assigned user or team
      sendCommentEmail(task, text || 'Attached an image', req.user).catch(console.error);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks — create
router.post('/', async (req, res) => {
  try {
    const data = taskSchema.parse(req.body);
    const { overdueFlag, overdueTeam, isClosed } = calculateOverdue(
      new Date(data.deadline), data.devStatus, data.testStatus
    );

    const task = await prisma.task.create({
      data: {
        ...data,
        deadline: new Date(data.deadline),
        overdueFlag,
        overdueTeam,
        isClosed,
      },
      include: { 
        assignedUser: { select: { id: true, name: true, email: true } },
        assignedTeam: { include: { users: true } }
      },
    });

    if (task.assignedTeamId && task.assignedTeam) {
      sendTeamAssignmentEmail(task, task.assignedTeam, req.user).catch(console.error);
      
      const notifyUsers = task.assignedTeam.users.filter(u => u.id !== req.user.id);
      if (notifyUsers.length > 0) {
        await prisma.notification.createMany({
          data: notifyUsers.map(u => ({
            userId: u.id,
            title: `Team Task: ${task.title}`,
            message: `${req.user.name} assigned a new task to your team.`,
            taskId: task.id
          }))
        });
      }
    }

    if (task.assignedUserId && task.assignedUserId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: task.assignedUserId,
          title: `Task Assigned: ${task.title}`,
          message: `${req.user.name} assigned a new task directly to you.`,
          taskId: task.id
        }
      });
      sendTaskAssignedEmail(task, req.user).catch(console.error);
    }

    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id — update
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    // Get existing task for fields not being updated
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const mergedDevStatus = data.devStatus ?? existing.devStatus;
    const mergedTestStatus = data.testStatus ?? existing.testStatus;
    const mergedDeadline = data.deadline ? new Date(data.deadline) : existing.deadline;

    const { overdueFlag, overdueTeam, isClosed } = calculateOverdue(
      mergedDeadline, mergedDevStatus, mergedTestStatus
    );

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
        overdueFlag,
        overdueTeam,
        isClosed,
      },
      include: { 
        assignedUser: { select: { id: true, name: true, email: true } },
        assignedTeam: { include: { users: true } }
      },
    });

    // Notify all team members on ANY update (not just when team changes)
    if (task.assignedTeamId && task.assignedTeam) {
      const notifyTeamUsers = task.assignedTeam.users.filter(u => u.id !== req.user.id);
      if (notifyTeamUsers.length > 0) {
        await prisma.notification.createMany({
          data: notifyTeamUsers.map(u => ({
            userId: u.id,
            title: `Task Updated: ${task.title}`,
            message: `${req.user.name} made changes to a group task.`,
            taskId: task.id
          }))
        });
      }
      // Email if team changed
      if (existing.assignedTeamId !== task.assignedTeamId) {
        sendTeamAssignmentEmail(task, task.assignedTeam, req.user).catch(console.error);
      }
    }

    if (task.assignedUserId && task.assignedUserId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: task.assignedUserId,
          title: `Task Updated: ${task.title}`,
          message: `${req.user.name} made changes to your assigned task.`,
          taskId: task.id
        }
      });
      sendTaskUpdateEmail(task, req.user).catch(console.error);
    }

    res.json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/tasks/notify-now — dev endpoint to manually trigger cron
router.post('/notify-now', async (req, res) => {
  try {
    await runNotificationCheck();
    res.json({ message: 'Notification check triggered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
