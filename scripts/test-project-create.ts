import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.project.create({
  data: {
    teamId: 'cmomomomo0000test0000000',
    title: 'test',
    resources: { create: [] }
  }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
