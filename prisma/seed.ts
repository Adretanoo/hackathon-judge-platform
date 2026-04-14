/**
 * @file prisma/seed.ts
 * @description Full database seed with realistic test data for all tables.
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║              TEST ACCOUNT CREDENTIALS               ║
 * ╠══════════════════════════════════════════════════════╣
 * ║  GLOBAL ADMIN   admin@platform.com   / Admin@123!   ║
 * ║  ORGANIZER      organizer@hack.io    / Test@1234!   ║
 * ║  JUDGE 1        judge1@eval.io       / Test@1234!   ║
 * ║  JUDGE 2        judge2@eval.io       / Test@1234!   ║
 * ║  PARTICIPANT 1  alice@dev.io         / Test@1234!   ║
 * ║  PARTICIPANT 2  bob@dev.io           / Test@1234!   ║
 * ║  PARTICIPANT 3  carol@dev.io         / Test@1234!   ║
 * ║  PARTICIPANT 4  dave@dev.io          / Test@1234!   ║
 * ║  PARTICIPANT 5  eva@dev.io           / Test@1234!   ║
 * ║  PARTICIPANT 6  frank@dev.io         / Test@1234!   ║
 * ╚══════════════════════════════════════════════════════╝
 */

import {
  PrismaClient,
  RoleName,
  HackathonStatus,
  TeamStatus,
  TeamMemberRole,
  ProjectStatus,
  ConflictType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SHARED_PASSWORD = 'Test@1234!';
const ADMIN_PASSWORD  = 'Admin@123!';

async function hash(pwd: string) {
  return bcrypt.hash(pwd, 10);
}

async function main() {
  console.log('🌱 Starting full database seed...\n');

  // ─── 1. USERS ──────────────────────────────────────────────────────────────

  const adminHash   = await hash(ADMIN_PASSWORD);
  const sharedHash  = await hash(SHARED_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      username: 'superadmin',
      fullName: 'Global Admin',
      passwordHash: adminHash,
      bio: 'Platform administrator with full access.',
      isVerified: true,
      skills: ['Management', 'DevOps', 'Security'],
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@hack.io' },
    update: {},
    create: {
      email: 'organizer@hack.io',
      username: 'organizer_main',
      fullName: 'Олена Проценко',
      passwordHash: sharedHash,
      bio: 'Досвідчений організатор хакатонів. Провела 12+ подій.',
      isVerified: true,
      skills: ['Event Management', 'Agile', 'Community Building'],
    },
  });

  const judge1 = await prisma.user.upsert({
    where: { email: 'judge1@eval.io' },
    update: {},
    create: {
      email: 'judge1@eval.io',
      username: 'judge_alex',
      fullName: 'Олексій Бондар',
      passwordHash: sharedHash,
      bio: 'Senior ML Engineer at Google. Expert in AI systems.',
      isVerified: true,
      skills: ['Machine Learning', 'Python', 'TensorFlow', 'Research'],
    },
  });

  const judge2 = await prisma.user.upsert({
    where: { email: 'judge2@eval.io' },
    update: {},
    create: {
      email: 'judge2@eval.io',
      username: 'judge_marina',
      fullName: 'Марина Ковальчук',
      passwordHash: sharedHash,
      bio: 'CTO at TechStart UA. Full-stack architect and startup mentor.',
      isVerified: true,
      skills: ['Architecture', 'TypeScript', 'Cloud', 'Startups'],
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@dev.io' },
    update: {},
    create: {
      email: 'alice@dev.io',
      username: 'alice_dev',
      fullName: 'Аліса Мельник',
      passwordHash: sharedHash,
      bio: 'Frontend developer passionate about UI/UX and React.',
      isVerified: true,
      isLookingForTeam: false,
      skills: ['React', 'TypeScript', 'Figma', 'CSS'],
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@dev.io' },
    update: {},
    create: {
      email: 'bob@dev.io',
      username: 'bob_backend',
      fullName: 'Богдан Харченко',
      passwordHash: sharedHash,
      bio: 'Backend engineer. Node.js, PostgreSQL, building APIs since 2018.',
      isVerified: true,
      isLookingForTeam: false,
      skills: ['Node.js', 'PostgreSQL', 'Docker', 'Redis'],
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@dev.io' },
    update: {},
    create: {
      email: 'carol@dev.io',
      username: 'carol_ai',
      fullName: 'Кароліна Захаренко',
      passwordHash: sharedHash,
      bio: 'AI/ML researcher and Python developer. Love building intelligent systems.',
      isVerified: true,
      isLookingForTeam: false,
      skills: ['Python', 'PyTorch', 'AI/ML', 'Data Science'],
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: 'dave@dev.io' },
    update: {},
    create: {
      email: 'dave@dev.io',
      username: 'dave_design',
      fullName: 'Давид Савченко',
      passwordHash: sharedHash,
      bio: 'Product designer and no-code developer. Figma expert.',
      isVerified: true,
      isLookingForTeam: true,
      skills: ['Figma', 'UI/UX', 'Webflow', 'Design Systems'],
    },
  });

  const eva = await prisma.user.upsert({
    where: { email: 'eva@dev.io' },
    update: {},
    create: {
      email: 'eva@dev.io',
      username: 'eva_fullstack',
      fullName: 'Єва Романенко',
      passwordHash: sharedHash,
      bio: 'Fullstack developer with experience in fintech.',
      isVerified: true,
      isLookingForTeam: true,
      skills: ['React', 'Node.js', 'Fullstack', 'FinTech'],
    },
  });

  const frank = await prisma.user.upsert({
    where: { email: 'frank@dev.io' },
    update: {},
    create: {
      email: 'frank@dev.io',
      username: 'frank_mobile',
      fullName: 'Франко Кириленко',
      passwordHash: sharedHash,
      bio: 'Mobile developer (React Native / Flutter). Love cross-platform apps.',
      isVerified: true,
      isLookingForTeam: true,
      skills: ['React Native', 'Flutter', 'Dart', 'Mobile'],
    },
  });

  console.log('✅ Users created (10 total)');

  // ─── 2. ROLES ──────────────────────────────────────────────────────────────

  await prisma.userRole.createMany({
    skipDuplicates: true,
    data: [
      { userId: admin.id,     roleName: RoleName.GLOBAL_ADMIN },
      { userId: admin.id,     roleName: RoleName.ORGANIZER },
      { userId: organizer.id, roleName: RoleName.ORGANIZER },
      { userId: judge1.id,    roleName: RoleName.JUDGE },
      { userId: judge2.id,    roleName: RoleName.JUDGE },
      { userId: alice.id,     roleName: RoleName.PARTICIPANT },
      { userId: bob.id,       roleName: RoleName.PARTICIPANT },
      { userId: carol.id,     roleName: RoleName.PARTICIPANT },
      { userId: dave.id,      roleName: RoleName.PARTICIPANT },
      { userId: eva.id,       roleName: RoleName.PARTICIPANT },
      { userId: frank.id,     roleName: RoleName.PARTICIPANT },
    ],
  });

  console.log('✅ Global roles assigned');

  // ─── 3. SPECIALTIES + GROUPS ───────────────────────────────────────────────

  const specialty = await prisma.specialty.upsert({
    where: { code: 'CS-122' },
    update: {},
    create: { code: 'CS-122', name: 'Computer Science' },
  });

  const group = await prisma.studentGroup.upsert({
    where: { name: 'CS-122-3A' },
    update: {},
    create: { specialtyId: specialty.id, name: 'CS-122-3A', year: 3 },
  });

  // Assign student info to participants
  for (const [user, code] of [
    [alice, 'STU-001'],
    [bob,   'STU-002'],
    [carol, 'STU-003'],
    [dave,  'STU-004'],
  ] as const) {
    await prisma.studentInfo.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        studentCode: code,
        groupId: group.id,
        year: 3,
        gpa: 3.8,
      },
    });
  }

  console.log('✅ Academic data seeded');

  // ─── 4. HACKATHON ──────────────────────────────────────────────────────────

  const now       = new Date();
  const reg_end   = new Date(now.getTime() + 2  * 24 * 60 * 60 * 1000);
  const hack_start= new Date(now.getTime() + 5  * 24 * 60 * 60 * 1000);
  const hack_end  = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  const judge_end = new Date(now.getTime() + 9  * 24 * 60 * 60 * 1000);

  let hackathon = await prisma.hackathon.findFirst({
    where: { title: 'AI for Good Hackathon 2026' },
  });

  if (!hackathon) {
    hackathon = await prisma.hackathon.create({
      data: {
        organizerId: organizer.id,
        title: 'AI for Good Hackathon 2026',
        subtitle: 'Будуємо майбутнє разом за допомогою штучного інтелекту',
        description: `Масштабний онлайн-хакатон для всіх, хто хоче змінити світ на краще за допомогою AI.
Беріть участь у командах до 4 осіб, обирайте трек та вражайте суддів своїм рішенням за 48 годин!`,
        isOnline: true,
        status: HackathonStatus.REGISTRATION_OPEN,
        minTeamSize: 2,
        maxTeamSize: 4,
        registrationDeadline: reg_end,
        startDate: hack_start,
        endDate: hack_end,
        bannerUrl: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200',
        websiteUrl: 'https://aiforgood.hack.io',
      },
    });
  }

  // Organizer role scoped to hackathon
  await prisma.userRole.upsert({
    where: {
      userId_roleName_hackathonId: {
        userId: organizer.id,
        roleName: RoleName.ORGANIZER,
        hackathonId: hackathon.id,
      },
    },
    update: {},
    create: {
      userId: organizer.id,
      roleName: RoleName.ORGANIZER,
      hackathonId: hackathon.id,
    },
  });

  console.log('✅ Hackathon created');

  // ─── 5. STAGES ─────────────────────────────────────────────────────────────

  const stagesData = [
    { name: 'Check-in & Registration',  orderIndex: 0, start: now,        end: reg_end   },
    { name: 'Hacking Phase',            orderIndex: 1, start: hack_start, end: hack_end  },
    { name: 'Project Submission',       orderIndex: 2, start: hack_end,   end: judge_end },
    { name: 'Judging & Evaluation',     orderIndex: 3, start: judge_end,
      end: new Date(judge_end.getTime() + 2 * 24 * 60 * 60 * 1000) },
  ];

  for (const s of stagesData) {
    await prisma.stage.upsert({
      where: { hackathonId_orderIndex: { hackathonId: hackathon.id, orderIndex: s.orderIndex } },
      update: {},
      create: {
        hackathonId: hackathon.id,
        name: s.name,
        orderIndex: s.orderIndex,
        startDate: s.start,
        endDate: s.end,
      },
    });
  }

  console.log('✅ Stages seeded (4)');

  // ─── 6. TRACKS ─────────────────────────────────────────────────────────────

  const trackAI = await prisma.track.upsert({
    where: { hackathonId_name: { hackathonId: hackathon.id, name: 'Generative AI' } },
    update: {},
    create: {
      hackathonId: hackathon.id,
      name: 'Generative AI',
      description: 'Рішення на основі LLM, image generation, RAG систем.',
      maxTeams: 10,
    },
  });

  const trackWeb = await prisma.track.upsert({
    where: { hackathonId_name: { hackathonId: hackathon.id, name: 'Web & Mobile' } },
    update: {},
    create: {
      hackathonId: hackathon.id,
      name: 'Web & Mobile',
      description: 'SaaS-продукти, мобільні додатки, PWA та веб-платформи.',
      maxTeams: 10,
    },
  });

  console.log('✅ Tracks seeded (2)');

  // ─── 7. CRITERIA ───────────────────────────────────────────────────────────

  const aiCriteria = [
    { name: 'Технічна реалізація',  description: 'Якість коду, архітектура, AI-підхід',   weight: 0.35, maxScore: 10, orderIndex: 0 },
    { name: 'Інноваційність',       description: 'Унікальність ідеї та підходу',           weight: 0.25, maxScore: 10, orderIndex: 1 },
    { name: 'Практичність',         description: 'Реальна користь та use case',             weight: 0.25, maxScore: 10, orderIndex: 2 },
    { name: 'Презентація',          description: 'Демо, pitch, зрозумілість',               weight: 0.15, maxScore: 10, orderIndex: 3 },
  ];

  const webCriteria = [
    { name: 'UX/UI Дизайн',         description: 'Зручність, естетика, юзабіліті',         weight: 0.30, maxScore: 10, orderIndex: 0 },
    { name: 'Технічна складність',  description: 'Складність стеку, масштабованість',      weight: 0.30, maxScore: 10, orderIndex: 1 },
    { name: 'Бізнес-потенціал',     description: 'Монетизація, ринок, перспективи',        weight: 0.25, maxScore: 10, orderIndex: 2 },
    { name: 'Presentation',         description: 'Pitch deck, demo, communication',         weight: 0.15, maxScore: 10, orderIndex: 3 },
  ];

  for (const c of aiCriteria) {
    await prisma.criteria.upsert({
      where: { id: `seed-ai-crit-${c.orderIndex}` },
      update: {},
      create: { id: `seed-ai-crit-${c.orderIndex}`, trackId: trackAI.id, ...c },
    });
  }

  for (const c of webCriteria) {
    await prisma.criteria.upsert({
      where: { id: `seed-web-crit-${c.orderIndex}` },
      update: {},
      create: { id: `seed-web-crit-${c.orderIndex}`, trackId: trackWeb.id, ...c },
    });
  }

  console.log('✅ Criteria seeded (4 per track)');

  // ─── 8. PARTICIPANTS (register to hackathon via UserRole) ──────────────────

  const participants = [alice, bob, carol, dave, eva, frank];
  for (const p of participants) {
    await prisma.userRole.upsert({
      where: {
        userId_roleName_hackathonId: {
          userId: p.id,
          roleName: RoleName.PARTICIPANT,
          hackathonId: hackathon.id,
        },
      },
      update: {},
      create: {
        userId: p.id,
        roleName: RoleName.PARTICIPANT,
        hackathonId: hackathon.id,
      },
    });
  }

  console.log('✅ Participants registered (6)');

  // ─── 9. TEAMS ──────────────────────────────────────────────────────────────

  let teamNeuron = await prisma.team.findFirst({
    where: { hackathonId: hackathon.id, name: 'NeuronForge' },
  });

  if (!teamNeuron) {
    teamNeuron = await prisma.team.create({
      data: {
        hackathonId: hackathon.id,
        trackId: trackAI.id,
        name: 'NeuronForge',
        description: 'Будуємо AI-асистента для освіти. RAG + GPT-4.',
        status: TeamStatus.SUBMITTED,
        isOpen: false,
        members: {
          create: [
            { userId: alice.id, role: TeamMemberRole.CAPTAIN },
            { userId: bob.id,   role: TeamMemberRole.MEMBER  },
            { userId: carol.id, role: TeamMemberRole.MEMBER  },
          ],
        },
      },
    });
  }

  let teamPixel = await prisma.team.findFirst({
    where: { hackathonId: hackathon.id, name: 'PixelCraft' },
  });

  if (!teamPixel) {
    teamPixel = await prisma.team.create({
      data: {
        hackathonId: hackathon.id,
        trackId: trackWeb.id,
        name: 'PixelCraft',
        description: 'SaaS платформа для дизайнерів з AI-інструментами.',
        status: TeamStatus.SUBMITTED,
        isOpen: false,
        members: {
          create: [
            { userId: dave.id,  role: TeamMemberRole.CAPTAIN },
            { userId: eva.id,   role: TeamMemberRole.MEMBER  },
            { userId: frank.id, role: TeamMemberRole.MEMBER  },
          ],
        },
      },
    });
  }

  console.log('✅ Teams seeded (2)');

  // ─── 10. PROJECTS ──────────────────────────────────────────────────────────

  let projectEduBot = await prisma.project.findFirst({
    where: { teamId: teamNeuron.id, title: 'EduBot AI' },
  });

  if (!projectEduBot) {
    projectEduBot = await prisma.project.create({
      data: {
        teamId: teamNeuron.id,
        title: 'EduBot AI',
        description: 'AI-репетитор для школярів. Генерує персоналізовані завдання, пояснює теми, відстежує прогрес. Побудовано на RAG + GPT-4.',
        repoUrl: 'https://github.com/neuronforge/edubot-ai',
        demoUrl: 'https://edubot.neuronforge.io',
        videoUrl: 'https://youtube.com/watch?v=demo123',
        techStack: ['TypeScript', 'Next.js', 'OpenAI API', 'Pinecone', 'PostgreSQL'],
        status: ProjectStatus.SUBMITTED,
        submittedAt: new Date(),
        averageScore: 8.7,
        totalScore: 87.0,
      },
    });
  }

  let projectDesignAI = await prisma.project.findFirst({
    where: { teamId: teamPixel.id, title: 'PixelCraft Studio' },
  });

  if (!projectDesignAI) {
    projectDesignAI = await prisma.project.create({
      data: {
        teamId: teamPixel.id,
        title: 'PixelCraft Studio',
        description: 'Колаборативна дизайн-платформа з AI-генерацією компонентів. Аналог Figma + Midjourney в одному інструменті.',
        repoUrl: 'https://github.com/pixelcraft/studio',
        demoUrl: 'https://pixelcraft.studio',
        videoUrl: 'https://youtube.com/watch?v=pixel456',
        techStack: ['React', 'Node.js', 'Stable Diffusion', 'WebSockets', 'AWS S3'],
        status: ProjectStatus.SUBMITTED,
        submittedAt: new Date(),
        averageScore: 9.1,
        totalScore: 91.0,
      },
    });
  }

  console.log('✅ Projects seeded (2)');

  // ─── 11. JUDGE ASSIGNMENTS ─────────────────────────────────────────────────

  await prisma.judgeAssignment.upsert({
    where: {
      judgeId_hackathonId_trackId: {
        judgeId: judge1.id,
        hackathonId: hackathon.id,
        trackId: trackAI.id,
      },
    },
    update: {},
    create: {
      judgeId: judge1.id,
      hackathonId: hackathon.id,
      trackId: trackAI.id,
    },
  });

  await prisma.judgeAssignment.upsert({
    where: {
      judgeId_hackathonId_trackId: {
        judgeId: judge2.id,
        hackathonId: hackathon.id,
        trackId: trackWeb.id,
      },
    },
    update: {},
    create: {
      judgeId: judge2.id,
      hackathonId: hackathon.id,
      trackId: trackWeb.id,
    },
  });

  console.log('✅ Judges assigned (judge1 → AI track, judge2 → Web track)');

  // ─── 12. SCORES ────────────────────────────────────────────────────────────

  // Judge1 scores EduBot AI (AI track)
  const aiCriteriaFromDb = await prisma.criteria.findMany({
    where: { trackId: trackAI.id },
  });

  const judge1Scores = [8.5, 9.0, 8.5, 9.0];
  for (let i = 0; i < aiCriteriaFromDb.length; i++) {
    const c = aiCriteriaFromDb[i];
    await prisma.score.upsert({
      where: {
        judgeId_projectId_criteriaId: {
          judgeId: judge1.id,
          projectId: projectEduBot.id,
          criteriaId: c.id,
        },
      },
      update: {},
      create: {
        judgeId: judge1.id,
        projectId: projectEduBot.id,
        criteriaId: c.id,
        scoreValue: judge1Scores[i] ?? 8.0,
        comment: `Оцінка за критерій «${c.name}»: демо вразило.`,
      },
    });
  }

  // Judge2 scores PixelCraft Studio (Web track)
  const webCriteriaFromDb = await prisma.criteria.findMany({
    where: { trackId: trackWeb.id },
  });

  const judge2Scores = [9.5, 9.0, 9.0, 8.5];
  for (let i = 0; i < webCriteriaFromDb.length; i++) {
    const c = webCriteriaFromDb[i];
    await prisma.score.upsert({
      where: {
        judgeId_projectId_criteriaId: {
          judgeId: judge2.id,
          projectId: projectDesignAI.id,
          criteriaId: c.id,
        },
      },
      update: {},
      create: {
        judgeId: judge2.id,
        projectId: projectDesignAI.id,
        criteriaId: c.id,
        scoreValue: judge2Scores[i] ?? 8.0,
        comment: `Score for «${c.name}»: outstanding work.`,
      },
    });
  }

  console.log('✅ Scores seeded (8 total)');

  // ─── 13. JUDGE CONFLICT ────────────────────────────────────────────────────

  await prisma.judgeConflict.upsert({
    where: {
      judgeId_teamId: {
        judgeId: judge1.id,
        teamId: teamPixel.id,
      },
    },
    update: {},
    create: {
      judgeId: judge1.id,
      teamId: teamPixel.id,
      type: ConflictType.MENTORED_TEAM,
      reason: 'Суддя Олексій раніше менторував команду PixelCraft в рамках університетської програми.',
      overridden: false,
    },
  });

  console.log('✅ Judge conflict seeded (1)');

  // ─── 14. AWARDS ────────────────────────────────────────────────────────────

  const awardsExist = await prisma.award.findFirst({
    where: { hackathonId: hackathon.id },
  });

  if (!awardsExist) {
    await prisma.award.createMany({
      data: [
        { hackathonId: hackathon.id, title: 'Grand Prize',    prize: '$5,000 + MacBook Pro',  rank: 1, description: 'Переможець серед усіх треків.' },
        { hackathonId: hackathon.id, title: 'Runner Up',      prize: '$2,000 + Swag Kit',     rank: 2, description: 'Друге місце.' },
        { hackathonId: hackathon.id, title: 'Best AI Track',  prize: '$1,500 + OpenAI Credits',rank: 1, description: 'Переможець треку Generative AI.' },
        { hackathonId: hackathon.id, title: 'Best Web Track', prize: '$1,500 + AWS Credits',  rank: 1, description: 'Переможець треку Web & Mobile.' },
      ],
    });
  }

  console.log('✅ Awards seeded (4)');

  // ─── 15. HACKATHON TAGS ────────────────────────────────────────────────────

  const tagNames = ['AI', 'Web3', 'HealthTech', 'EdTech', 'Open Source'];
  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const tag = await prisma.hackathonTag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    await prisma.hackathonTagRelation.upsert({
      where: { hackathonId_tagId: { hackathonId: hackathon.id, tagId: tag.id } },
      update: {},
      create: { hackathonId: hackathon.id, tagId: tag.id },
    });
  }

  console.log('✅ Tags seeded (5)');

  // ─── 16. SYSTEM CONFIG ─────────────────────────────────────────────────────

  const configs = [
    { key: 'smtp.host',           value: 'smtp.gmail.com' },
    { key: 'smtp.port',           value: 587 },
    { key: 'smtp.secure',         value: false },
    { key: 'features.email',      value: true },
    { key: 'features.websockets', value: true },
    { key: 'features.export',     value: true },
    { key: 'platform.name',       value: 'HackJudge Platform' },
    { key: 'platform.supportEmail', value: 'support@hackjudge.io' },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: { key: cfg.key, value: cfg.value as any },
    });
  }

  console.log('✅ System config seeded (8 entries)');

  // ─── DONE ──────────────────────────────────────────────────────────────────

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║              TEST ACCOUNT CREDENTIALS               ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  GLOBAL ADMIN   admin@platform.com   / Admin@123!   ║');
  console.log('║  ORGANIZER      organizer@hack.io    / Test@1234!   ║');
  console.log('║  JUDGE 1        judge1@eval.io       / Test@1234!   ║');
  console.log('║  JUDGE 2        judge2@eval.io       / Test@1234!   ║');
  console.log('║  PARTICIPANT 1  alice@dev.io         / Test@1234!   ║');
  console.log('║  PARTICIPANT 2  bob@dev.io           / Test@1234!   ║');
  console.log('║  PARTICIPANT 3  carol@dev.io         / Test@1234!   ║');
  console.log('║  PARTICIPANT 4  dave@dev.io          / Test@1234!   ║');
  console.log('║  PARTICIPANT 5  eva@dev.io           / Test@1234!   ║');
  console.log('║  PARTICIPANT 6  frank@dev.io         / Test@1234!   ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
  console.log('🎉 Full seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
