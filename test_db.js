const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const invites = await prisma.teamInvite.findMany();
  console.log('Invites:', invites);
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log('Users:', users);
  const memberships = await prisma.teamMember.findMany({ include: { team: true } });
  console.log('Memberships:', memberships.map(m => ({ userId: m.userId, teamId: m.teamId, hackathonId: m.team.hackathonId })));
  const roles = await prisma.userRole.findMany();
  console.log('Roles:', roles);
  await prisma.$disconnect();
}
run();
