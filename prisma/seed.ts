/**
 * @file prisma/seed.ts
 * @description Automatically seeds the database with necessary enums (RoleName) 
 *              and creates a default organizer and sample hackathon.
 */

import { PrismaClient, RoleName, HackathonStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Global Roles
  const roles = Object.values(RoleName);
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: {
        name: role,
        description: `Platform role: ${role}`,
      },
    });
  }
  console.log('✅ Roles seeded.');

  // 2. Seed default organizer
  const organizerEmail = 'admin@platform.com';
  let organizer = await prisma.user.findUnique({ where: { email: organizerEmail } });

  if (!organizer) {
    const passwordHash = await bcrypt.hash('Admin@123!', 10);
    organizer = await prisma.user.create({
      data: {
        email: organizerEmail,
        username: 'superadmin',
        fullName: 'Global Admin',
        passwordHash,
      },
    });
    
    // Assign global admin and organizer global roles
    const adminRole = await prisma.role.findUnique({ where: { name: RoleName.GLOBAL_ADMIN } });
    const orgRole = await prisma.role.findUnique({ where: { name: RoleName.ORGANIZER } });
    
    await prisma.userRole.createMany({
      data: [
        { userId: organizer.id, roleId: adminRole!.id },
        { userId: organizer.id, roleId: orgRole!.id },
      ],
      skipDuplicates: true
    });
    console.log('✅ Global admin created (admin@platform.com / Admin@123!).');
  }

  // 3. Seed sample Hackathon
  const sampleHackathon = await prisma.hackathon.findFirst({
    where: { title: 'Global Innovators Hack 2026' }
  });

  if (!sampleHackathon) {
    const start = new Date();
    start.setDate(start.getDate() + 10);
    const end = new Date();
    end.setDate(end.getDate() + 12);

    const hackathon = await prisma.hackathon.create({
      data: {
        organizerId: organizer.id,
        title: 'Global Innovators Hack 2026',
        subtitle: 'Shape the Future of AI',
        description: 'A massive online competition to push AI boundaries.',
        isOnline: true,
        status: HackathonStatus.DRAFT,
        startDate: start,
        endDate: end,
        stages: {
          create: [
            { name: 'Registration Phase', orderIndex: 1, startDate: new Date(), endDate: start },
            { name: 'Hacking Phase', orderIndex: 2, startDate: start, endDate: end }
          ]
        },
        tracks: {
          create: [
            { name: 'Generative AI', description: 'Create stunning apps using GenAI' },
            { name: 'Open Web', description: 'Build decentralized solutions' }
          ]
        },
        awards: {
          create: [
            { title: 'Grand Prize', prize: '$10,000 + Tech Setup', rank: 1 },
            { title: 'Runner Up', prize: '$5,000', rank: 2 }
          ]
        }
      }
    });

    const orgRole = await prisma.role.findUnique({ where: { name: RoleName.ORGANIZER } });
    await prisma.userRole.create({
      data: {
        userId: organizer.id,
        roleId: orgRole!.id,
        hackathonId: hackathon.id
      }
    });

    console.log('✅ Sample Hackathon created.');
  } else {
    console.log('⏭️ Sample Hackathon already exists. Skipping.');
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
