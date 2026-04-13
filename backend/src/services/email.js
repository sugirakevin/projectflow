const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'ProjectFlow <onboarding@resend.dev>';
const APP_URL = process.env.CORS_ORIGIN || 'https://projectflow-mu.vercel.app';

async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Resend email error:', err);
  }
}

async function sendOverdueEmail(task) {
  const { title, deadline, devStatus, testStatus, overdueTeam, assignedUser } = task;
  const to = assignedUser?.email;
  if (!to) return;
  await sendEmail({
    to,
    subject: `⚠️ Task Overdue: ${title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#ef4444;">⚠️ Task Overdue</h2>
      <p>The following task is past its deadline:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Deadline</td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(deadline).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Responsible Team</td><td style="padding:8px;border:1px solid #e5e7eb;color:#ef4444;">${overdueTeam} Team</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Assigned To</td><td style="padding:8px;border:1px solid #e5e7eb;">${assignedUser?.name} (${to})</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">Update the task in <a href="${APP_URL}">ProjectFlow</a>.</p>
    </div>`
  });
}

async function sendDueSoonEmail(task) {
  const { title, deadline, devStatus, testStatus, assignedUser } = task;
  const to = assignedUser?.email;
  if (!to) return;
  await sendEmail({
    to,
    subject: `⏰ Task Due Soon: ${title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#f59e0b;">⏰ Task Due in 2 Days</h2>
      <p>This task is approaching its deadline:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Deadline</td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(deadline).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${APP_URL}">ProjectFlow</a>.</p>
    </div>`
  });
}

async function sendTaskAssignedEmail(task, assignedBy) {
  const { title, devStatus, testStatus, assignedUser, id } = task;
  const to = assignedUser?.email;
  if (!to) return;
  if (assignedBy.id === assignedUser.id) return;
  await sendEmail({
    to,
    subject: `🎯 Task Assigned: ${title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#8b5cf6;">🎯 New Task Assigned</h2>
      <p><b>${assignedBy.name}</b> has assigned a task to you.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${APP_URL}/tasks/${id}">ProjectFlow</a>.</p>
    </div>`
  });
}

async function sendTaskUpdateEmail(task, updatedBy) {
  const { title, devStatus, testStatus, assignedUser, id } = task;
  const to = assignedUser?.email;
  if (!to) return;
  if (updatedBy.id === assignedUser.id) return;
  await sendEmail({
    to,
    subject: `📝 Task Updated: ${title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#3b82f6;">📝 Task Updated</h2>
      <p><b>${updatedBy.name}</b> made changes to your assigned task.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${APP_URL}/tasks/${id}">ProjectFlow</a>.</p>
    </div>`
  });
}

async function sendCommentEmail(task, text, author) {
  const to = task.assignedUser?.email;
  if (!to) return;
  if (author.id === task.assignedUser?.id) return;
  await sendEmail({
    to,
    subject: `💬 New Comment on: ${task.title}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#8b5cf6;">💬 New Comment</h2>
      <p><b>${author.name}</b> commented on your task: <b>${task.title}</b></p>
      <div style="padding:12px;background:#f3f4f6;border-radius:6px;margin:16px 0;font-style:italic;">"${text}"</div>
      <p style="margin-top:16px;color:#6b7280;">Reply in <a href="${APP_URL}/tasks/${task.id}">ProjectFlow</a>.</p>
    </div>`
  });
}

async function sendTeamAssignmentEmail(task, team, assignedBy) {
  if (!team?.users?.length) return;
  const emails = team.users.filter(u => u.id !== assignedBy.id).map(u => u.email).filter(Boolean);
  if (!emails.length) return;
  for (const to of emails) {
    await sendEmail({
      to,
      subject: `👥 Team Assigned: ${task.title}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;">
        <h2 style="color:#10b981;">👥 New Team Task</h2>
        <p><b>${assignedBy.name}</b> assigned the task <b>${task.title}</b> to your team: <b>${team.name}</b>.</p>
        <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${APP_URL}/tasks/${task.id}">ProjectFlow</a>.</p>
      </div>`
    });
  }
}

module.exports = { sendOverdueEmail, sendDueSoonEmail, sendTaskUpdateEmail, sendTaskAssignedEmail, sendCommentEmail, sendTeamAssignmentEmail };
