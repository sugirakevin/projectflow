const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Get first admin user to be the creator
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      console.log('No admin found, getting any user');
      const anyUser = await prisma.user.findFirst();
      if (!anyUser) {
        console.log('No users found in DB. Nothing to migrate.');
        return;
      }
    }
    
    let creatorId = admin ? admin.id : (await prisma.user.findFirst()).id;

    // 2. See if there are tasks with no project
    const tasksWithoutProject = await prisma.task.findMany({
      where: { projectId: null }
    });

    if (tasksWithoutProject.length === 0) {
      console.log('No tasks without a project. DB is clean!');
      return;
    }

    console.log(`Found ${tasksWithoutProject.length} tasks without a project.`);

    // 3. Create a 'General' project if it doesn't exist
    let generalProject = await prisma.project.findFirst({
      where: { name: 'General Tasks' }
    });

    if (!generalProject) {
      console.log('Creating General Tasks project...');
      generalProject = await prisma.project.create({
        data: {
          name: 'General Tasks',
          description: 'A workspace for all legacy and unassigned tasks',
          status: 'ACTIVE',
          createdById: creatorId
        }
      });
    }

    // 4. Update all tasks to use this project
    console.log(`Assigning tasks to project ${generalProject.id}...`);
    const updateRes = await prisma.task.updateMany({
      where: { projectId: null },
      data: { projectId: generalProject.id }
    });

    console.log(`Successfully moved ${updateRes.count} tasks into 'General Tasks' project.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
