const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendOverdueEmail, sendDueSoonEmail } = require('./email');
const { calculateOverdue } = require('./overdue');

const prisma = new PrismaClient();

async function runNotificationCheck() {
  console.log('[CRON] Running notification check at', new Date().toISOString());
  const now = new Date();
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  try {
    const tasks = await prisma.task.findMany({
      where: {
        isClosed: false,
        assignedUserId: { not: null },
      },
      include: { assignedUser: true },
    });

    for (const task of tasks) {
      const { overdueFlag } = calculateOverdue(task.deadline, task.devStatus, task.testStatus);
      
      // Anti-spam: skip if notified today
      if (task.lastNotifiedAt && task.lastNotifiedAt >= todayStart) continue;

      const deadline = new Date(task.deadline);

      if (overdueFlag) {
        // Task is overdue — send overdue email
        try {
          await sendOverdueEmail(task);
          await prisma.task.update({ where: { id: task.id }, data: { lastNotifiedAt: now } });
          console.log(`[CRON] Overdue email sent for task: ${task.title}`);
        } catch (e) {
          console.error(`[CRON] Failed to send overdue email for ${task.title}:`, e.message);
        }
      } else if (deadline <= twoDaysLater && deadline > now) {
        // Task due within 2 days — send warning email
        try {
          await sendDueSoonEmail(task);
          await prisma.task.update({ where: { id: task.id }, data: { lastNotifiedAt: now } });
          console.log(`[CRON] Due-soon email sent for task: ${task.title}`);
        } catch (e) {
          console.error(`[CRON] Failed to send due-soon email for ${task.title}:`, e.message);
        }
      }
    }

    console.log(`[CRON] Notification check complete. Processed ${tasks.length} tasks.`);
  } catch (err) {
    console.error('[CRON] Error during notification check:', err);
  }
}

function initCron() {
  // Run every day at 8:00 AM
  cron.schedule('0 8 * * *', runNotificationCheck);
  console.log('[CRON] Scheduler initialized — daily at 08:00');
}

module.exports = { initCron, runNotificationCheck };
