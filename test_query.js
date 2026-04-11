const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const userId = 'cmntqvx2h000013juew1sapj9'; // koval@gmail.com
  const hackathonId = 'cmnszuo0o000i8eyprt2vg9fh';
  
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId,
      team: { hackathonId },
    },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, username: true, avatarUrl: true } },
            },
          },
          projects: true,
        },
      },
    },
  });
  
  console.log('QueryResult:', JSON.stringify(membership, null, 2));
  await prisma.$disconnect();
}
run();
