import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const judges = await prisma.userRole.findMany({ where: { roleName: 'JUDGE' } });
  console.log('Judges:', judges);

  const assignments = await prisma.judgeAssignment.findMany();
  console.log('Assignments:', assignments);

  const { ProjectService } = await import('../src/services/project.service');
  
  // Create mock app
  const mockApp = { prisma } as any;
  const service = new ProjectService(mockApp);
  
  const result = await service.listProjects(1, 100, {
    hackathonId: 'clpz12xyz000008la0ab12cd',
    judgeId: 'cmnzxha7l000386gh6ad1vmvh',
    statuses: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED'] as any
  });
  
  console.log('listProjects result count:', result.items.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
