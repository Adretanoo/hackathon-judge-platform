import {
  PrismaClient,
  RoleName,
  HackathonStatus,
  TeamStatus,
  TeamMemberRole,
  ProjectStatus,
  ConflictType,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Test@1234!';
const ADMIN_PASSWORD = 'Admin@123!';

async function hash(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function main() {
  console.log('🌱 Starting production-level database seed with Faker...');

  // ─── 1. GLOBAL ADMIN ───────────────────────────────────────────────────
  const adminHash = await hash(ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      username: 'superadmin',
      fullName: 'Системний Адміністратор',
      passwordHash: adminHash,
      isVerified: true,
      bio: 'Головний адміністратор платформи',
      avatarUrl: faker.image.avatar(),
      skills: ['System Architecture', 'DevOps', 'Administration'],
    },
  });

  // ─── 2. ORGANIZERS ────────────────────────────────────────────────────
  const sharedHash = await hash(DEFAULT_PASSWORD);
  const organizers = [];
  for (let i = 1; i <= 2; i++) {
    const org = await prisma.user.upsert({
      where: { email: `organizer${i}@hack.io` },
      update: {},
      create: {
        email: `organizer${i}@hack.io`,
        username: `organizer_${i}`,
        fullName: faker.person.fullName(),
        passwordHash: sharedHash,
        isVerified: true,
        bio: faker.person.bio(),
        avatarUrl: faker.image.avatar(),
        skills: ['Event Management', 'Public Speaking', 'Agile'],
      },
    });
    organizers.push(org);
  }

  // ─── 3. JUDGES ────────────────────────────────────────────────────────
  const judges = [];
  for (let i = 1; i <= 3; i++) {
    const judge = await prisma.user.upsert({
      where: { email: `judge${i}@eval.io` },
      update: {},
      create: {
        email: `judge${i}@eval.io`,
        username: `judge_${i}`,
        fullName: faker.person.fullName(),
        passwordHash: sharedHash,
        isVerified: true,
        bio: `Senior Expert in ${faker.hacker.adjective()} ${faker.hacker.noun()}`,
        avatarUrl: faker.image.avatar(),
        skills: ['Architecture', 'Review', 'Mentoring'],
      },
    });
    judges.push(judge);
  }

  // ─── 4. PARTICIPANTS ──────────────────────────────────────────────────
  const participants = [];
  for (let i = 1; i <= 12; i++) {
    const isLooking = i > 8; // last 4 are looking for team
    const p = await prisma.user.upsert({
      where: { email: `participant${i}@dev.io` },
      update: {},
      create: {
        email: `participant${i}@dev.io`,
        username: `dev_user_${i}`,
        fullName: faker.person.fullName(),
        passwordHash: sharedHash,
        isVerified: true,
        bio: faker.person.bio(),
        avatarUrl: faker.image.avatar(),
        skills: [faker.hacker.noun(), faker.hacker.noun(), 'TypeScript', 'React'],
        isLookingForTeam: isLooking,
      },
    });
    participants.push(p);
  }

  // ─── GLOBAL ROLES ─────────────────────────────────────────────────────
  await prisma.userRole.createMany({
    skipDuplicates: true,
    data: [
      { userId: admin.id, roleName: RoleName.GLOBAL_ADMIN },
      ...organizers.map(o => ({ userId: o.id, roleName: RoleName.ORGANIZER })),
      ...judges.map(j => ({ userId: j.id, roleName: RoleName.JUDGE })),
      ...participants.map(p => ({ userId: p.id, roleName: RoleName.PARTICIPANT })),
    ],
  });

  // ─── 5. HACKATHONS ────────────────────────────────────────────────────
  const now = new Date();
  
  // Public Hackathon (Active/Judging)
  const publicStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const publicEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // Ended 2 days ago, so it's judging
  
  const publicHackathon = await prisma.hackathon.upsert({
    where: { id: 'clpz12xyz000008la0ab12cd' },
    update: { status: HackathonStatus.JUDGING },
    create: {
      id: 'clpz12xyz000008la0ab12cd',
      organizerId: organizers[0].id,
      title: 'Global Innoweave 2026',
      subtitle: 'Build the future of digital ecosystems',
      description: faker.lorem.paragraphs(2),
      isOnline: true,
      status: HackathonStatus.JUDGING,
      minTeamSize: 2,
      maxTeamSize: 4,
      startDate: publicStart,
      endDate: publicEnd,
      registrationDeadline: new Date(publicStart.getTime() - 5 * 24 * 60 * 60 * 1000),
      bannerUrl: faker.image.urlPicsumPhotos({ width: 1200, height: 400 }),
    },
  });

  // Private Hackathon (Draft/Upcoming)
  const privateStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const privateEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

  await prisma.hackathon.upsert({
    where: { id: 'clpz12xyz000008la0ab34ef' },
    update: {},
    create: {
      id: 'clpz12xyz000008la0ab34ef',
      organizerId: organizers[1].id,
      title: 'Corporate Security Challenge',
      subtitle: 'Invite-only security hackathon',
      description: faker.lorem.paragraphs(2),
      isOnline: false,
      location: 'Kyiv, Tech Hub',
      status: HackathonStatus.DRAFT,
      minTeamSize: 2,
      maxTeamSize: 5,
      startDate: privateStart,
      endDate: privateEnd,
    },
  });

  // ─── 6. STAGES ────────────────────────────────────────────────────────
  const stagesData = [
    { name: 'Registration', order: 0, start: new Date(publicStart.getTime() - 30 * 86400000), end: new Date(publicStart.getTime() - 5 * 86400000) },
    { name: 'Active Hacking', order: 1, start: publicStart, end: publicEnd },
    { name: 'Submission', order: 2, start: new Date(publicEnd.getTime() - 86400000), end: publicEnd },
    { name: 'Judging', order: 3, start: publicEnd, end: new Date(now.getTime() + 5 * 86400000) },
    { name: 'Completed', order: 4, start: new Date(now.getTime() + 5 * 86400000), end: new Date(now.getTime() + 10 * 86400000) },
  ];

  for (const s of stagesData) {
    await prisma.stage.upsert({
      where: { hackathonId_orderIndex: { hackathonId: publicHackathon.id, orderIndex: s.order } },
      update: {},
      create: { hackathonId: publicHackathon.id, name: s.name, orderIndex: s.order, startDate: s.start, endDate: s.end },
    });
  }

  // ─── 7. TRACKS ────────────────────────────────────────────────────────
  const tracks = [
    { name: 'Artificial Intelligence', desc: 'AI/ML solutions, LLMs, Computer Vision' },
    { name: 'Web & SaaS', desc: 'Fullstack platforms and tools' },
    { name: 'Mobile App', desc: 'Cross-platform mobile applications' },
  ];

  const trackIds = [];
  for (const t of tracks) {
    const tr = await prisma.track.upsert({
      where: { hackathonId_name: { hackathonId: publicHackathon.id, name: t.name } },
      update: {},
      create: { hackathonId: publicHackathon.id, name: t.name, description: t.desc },
    });
    trackIds.push(tr.id);
  }

  // ─── 8. CRITERIA ──────────────────────────────────────────────────────
  const criteriaList = [
    { name: 'Technical Execution', weight: 0.3 },
    { name: 'Innovation & Creativity', weight: 0.25 },
    { name: 'Business Potential', weight: 0.25 },
    { name: 'UX/UI & Design', weight: 0.2 },
  ];

  const allCriteria = [];
  for (const trackId of trackIds) {
    for (let i = 0; i < criteriaList.length; i++) {
      const crit = await prisma.criteria.upsert({
        where: { id: `clpz99crit00000000000_${trackId}_${i}`.slice(0, 24) },
        update: {},
        create: {
          id: `clpz99crit00000000000_${trackId}_${i}`.slice(0, 24),
          trackId,
          name: criteriaList[i].name,
          weight: criteriaList[i].weight,
          maxScore: 10,
          orderIndex: i,
        },
      });
      allCriteria.push(crit);
    }
  }

  // ─── 9. JUDGE ASSIGNMENTS ───────────────────────────────────────────
  // Every track gets at least 1 judge
  await prisma.judgeAssignment.upsert({
    where: { judgeId_hackathonId_trackId: { judgeId: judges[0].id, hackathonId: publicHackathon.id, trackId: trackIds[0] } },
    update: {}, create: { judgeId: judges[0].id, hackathonId: publicHackathon.id, trackId: trackIds[0] },
  });

  await prisma.judgeAssignment.upsert({
    where: { judgeId_hackathonId_trackId: { judgeId: judges[1].id, hackathonId: publicHackathon.id, trackId: trackIds[1] } },
    update: {}, create: { judgeId: judges[1].id, hackathonId: publicHackathon.id, trackId: trackIds[1] },
  });

  await prisma.judgeAssignment.upsert({
    where: { judgeId_hackathonId_trackId: { judgeId: judges[2].id, hackathonId: publicHackathon.id, trackId: trackIds[2] } },
    update: {}, create: { judgeId: judges[2].id, hackathonId: publicHackathon.id, trackId: trackIds[2] },
  });

  // ─── 10. TEAMS & MEMBERS ──────────────────────────────────────────────
  const activeParticipants = participants.slice(0, 8); // 8 users assigned to teams
  const userRoleData = [];

  const teamConfigurations = [
    { name: 'Synapse Connect', trackId: trackIds[0], members: [activeParticipants[0], activeParticipants[1]] },
    { name: 'NeuroForge', trackId: trackIds[0], members: [activeParticipants[2], activeParticipants[3]] },
    { name: 'CloudScale', trackId: trackIds[1], members: [activeParticipants[4], activeParticipants[5]] },
    { name: 'Nomad Mobile', trackId: trackIds[2], members: [activeParticipants[6], activeParticipants[7]] },
  ];

  const createdTeams = [];

  for (const tc of teamConfigurations) {
    const team = await prisma.team.upsert({
      where: { hackathonId_name: { hackathonId: publicHackathon.id, name: tc.name } },
      update: {},
      create: {
        hackathonId: publicHackathon.id,
        trackId: tc.trackId,
        name: tc.name,
        description: faker.company.catchPhrase(),
        status: TeamStatus.SUBMITTED,
        isOpen: false,
        members: {
          create: tc.members.map((u, idx) => ({
            userId: u.id,
            role: idx === 0 ? TeamMemberRole.CAPTAIN : TeamMemberRole.MEMBER,
          })),
        },
      },
    });
    createdTeams.push(team);

    // Register these users to the hackathon globally
    for (const u of tc.members) {
      userRoleData.push({ userId: u.id, roleName: RoleName.PARTICIPANT, hackathonId: publicHackathon.id });
    }
  }

  await prisma.userRole.createMany({ skipDuplicates: true, data: userRoleData });

  // ─── 11. PROJECTS ─────────────────────────────────────────────────────
  const createdProjects = [];
  for (const team of createdTeams) {
    const proj = await prisma.project.upsert({
      where: { id: `cproj00000000000000${team.id.substring(team.id.length-4)}` },
      update: {},
      create: {
        id: `cproj00000000000000${team.id.substring(team.id.length-4)}`,
        teamId: team.id,
        title: `Project by ${team.name}`,
        description: faker.lorem.paragraph(),
        repoUrl: `https://github.com/team-${team.name.toLowerCase().replace(/\s/g, '')}`,
        demoUrl: `https://${team.name.toLowerCase().replace(/\s/g, '')}.demo.app`,
        videoUrl: 'https://youtube.com/watch?v=demo',
        techStack: [faker.hacker.noun(), faker.hacker.noun(), 'PostgreSQL'],
        status: ProjectStatus.SUBMITTED,
        submittedAt: now,
      },
    });
    createdProjects.push(proj);
  }

  // ─── 12. SCORES (Fill Leaderboard) ────────────────────────────────────
  for (const proj of createdProjects) {
    const team = createdTeams.find(t => t.id === proj.teamId)!;
    // Find who judges this track
    const assignment = await prisma.judgeAssignment.findFirst({ where: { hackathonId: publicHackathon.id, trackId: team.trackId } });
    if (!assignment) continue;

    const judgeId = assignment.judgeId;
    const trackCriteria = allCriteria.filter(c => c.trackId === team.trackId);

    let totalRaw = 0;
    for (const crit of trackCriteria) {
      const scoreVal = faker.number.float({ min: 6, max: 10, fractionDigits: 1 });
      await prisma.score.upsert({
        where: { judgeId_projectId_criteriaId: { judgeId, projectId: proj.id, criteriaId: crit.id } },
        update: {},
        create: {
          judgeId,
          projectId: proj.id,
          criteriaId: crit.id,
          scoreValue: scoreVal,
          comment: faker.lorem.sentence(),
        },
      });
      totalRaw += scoreVal * Number(crit.weight);
    }

    await prisma.project.update({
      where: { id: proj.id },
      data: { totalScore: totalRaw, averageScore: totalRaw }, // Since 1 judge, avg == total
    });
  }

  // ─── 13. JUDGE CONFLICTS ──────────────────────────────────────────────
  await prisma.judgeConflict.upsert({
    where: { judgeId_teamId: { judgeId: judges[0].id, teamId: createdTeams[0].id } },
    update: {},
    create: {
      judgeId: judges[0].id,
      teamId: createdTeams[0].id,
      type: ConflictType.MENTORED_TEAM,
      reason: 'Суддя менторував цю команду минулого місяця.',
    },
  });

  // ─── 14. AWARDS ───────────────────────────────────────────────────────
  const awardData = [
    { title: '1st Place Global', rank: 1, prize: '$10,000' },
    { title: 'Best AI Track', rank: 1, prize: '$5,000 + Credits' },
    { title: 'Best Mobile Design', rank: 1, prize: 'Apple Devices' },
  ];
  for (const aw of awardData) {
    const safeTitle = aw.title.replace(/\s+/g, '-').slice(0, 10);
    const id = `caward00000000000000${safeTitle}`;
    await prisma.award.upsert({
      where: { id },
      update: {},
      create: { id, hackathonId: publicHackathon.id, title: aw.title, prize: aw.prize, rank: aw.rank },
    });
  }

  // ─── 15. NOTIFICATIONS ────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: activeParticipants[0].id,
      type: NotificationType.PROJECT_SUBMITTED,
      title: 'Проєкт здано успішно!',
      body: 'Ваш проєкт переведено на етап оцінювання.',
    },
  });

  // ─── 16. SYSTEM CONFIG ────────────────────────────────────────────────
  const configs = [
    { key: 'platform.name', value: 'Ultimate Hackathon Platform' },
    { key: 'features.email', value: true },
    { key: 'features.export', value: true },
  ];
  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: { key: cfg.key, value: cfg.value as any },
    });
  }

  console.log('✅ Seed completely successful. Data is rich, robust, and correctly relation-mapped.');
}

main()
  .catch((e) => {
    console.error('❌ SEED FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });