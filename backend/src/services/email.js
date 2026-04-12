const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOverdueEmail(task) {
  const { title, deadline, devStatus, testStatus, overdueTeam, assignedUser } = task;
  const to = assignedUser?.email;
  if (!to) return;

  const subject = `⚠️ Task Overdue: ${title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#ef4444;">⚠️ Task Overdue</h2>
      <p>The following task is past its deadline and requires attention:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Deadline</td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(deadline).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Responsible Team</td><td style="padding:8px;border:1px solid #e5e7eb; color:#ef4444;">${overdueTeam} Team</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Assigned To</td><td style="padding:8px;border:1px solid #e5e7eb;">${assignedUser?.name} (${to})</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">Please update the task status in <a href="${process.env.CORS_ORIGIN}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendDueSoonEmail(task) {
  const { title, deadline, devStatus, testStatus, assignedUser } = task;
  const to = assignedUser?.email;
  if (!to) return;

  const subject = `⏰ Task Due Soon: ${title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#f59e0b;">⏰ Task Due in 2 Days</h2>
      <p>This task is approaching its deadline:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Deadline</td><td style="padding:8px;border:1px solid #e5e7eb;">${new Date(deadline).toLocaleDateString()}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Assigned To</td><td style="padding:8px;border:1px solid #e5e7eb;">${assignedUser?.name} (${to})</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">Please update the task status in <a href="${process.env.CORS_ORIGIN}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendTaskAssignedEmail(task, assignedBy) {
  const { title, devStatus, testStatus, assignedUser, id } = task;
  const to = assignedUser?.email;
  if (!to) return;
  if (assignedBy.id === assignedUser.id) return; // Don't email if they assigned it to themselves

  const subject = `🎯 Task Assigned: ${title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#8b5cf6;">🎯 New Task Assigned</h2>
      <p><b>${assignedBy.name}</b> has freshly assigned a task to you.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${process.env.CORS_ORIGIN}/tasks/${id}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendTaskUpdateEmail(task, updatedBy) {
  const { title, devStatus, testStatus, assignedUser, id } = task;
  const to = assignedUser?.email;
  if (!to) return;
  if (updatedBy.id === assignedUser.id) return; // Don't email if they updated it themselves

  const subject = `📝 Task Updated: ${title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#3b82f6;">📝 Task Updated</h2>
      <p><b>${updatedBy.name}</b> has made changes to a task assigned to you.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Task</td><td style="padding:8px;border:1px solid #e5e7eb;">${title}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Dev Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${devStatus}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Test Status</td><td style="padding:8px;border:1px solid #e5e7eb;">${testStatus}</td></tr>
      </table>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${process.env.CORS_ORIGIN}/tasks/${id}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendCommentEmail(task, text, author) {
  const to = task.assignedUser?.email;
  if (!to) return;
  if (author.id === task.assignedUser?.id) return; // Don't email if they commented themselves

  const subject = `💬 New Comment on: ${task.title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#8b5cf6;">💬 New Comment</h2>
      <p><b>${author.name}</b> commented on your task: <b>${task.title}</b></p>
      <div style="padding:12px;background:#f3f4f6;border-radius:6px;margin:16px 0;font-style:italic;">
        "${text}"
      </div>
      <p style="margin-top:16px;color:#6b7280;">Reply to this comment in <a href="${process.env.CORS_ORIGIN}/tasks/${task.id}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

async function sendTeamAssignmentEmail(task, team, assignedBy) {
  const { title, id } = task;
  if (!team || !team.users || team.users.length === 0) return;

  // Collect all emails except maybe the person who assigned it 
  const emails = team.users
                   .filter(u => u.id !== assignedBy.id)
                   .map(u => u.email)
                   .filter(Boolean);
                   
  if (emails.length === 0) return;

  const subject = `👥 Team Assigned: ${title}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#10b981;">👥 New Team Task</h2>
      <p><b>${assignedBy.name}</b> assigned the task <b>${title}</b> to your team: <b>${team.name}</b>.</p>
      <p style="margin-top:16px;color:#6b7280;">View the task in <a href="${process.env.CORS_ORIGIN}/tasks/${id}">ProjectFlow</a>.</p>
    </div>
  `;

  await transporter.sendMail({ from: process.env.EMAIL_FROM, bcc: emails, subject, html });
}

module.exports = { sendOverdueEmail, sendDueSoonEmail, sendTaskUpdateEmail, sendTaskAssignedEmail, sendCommentEmail, sendTeamAssignmentEmail };
