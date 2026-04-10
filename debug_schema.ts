import { zodToJsonSchema } from 'zod-to-json-schema';
import * as authSchemas from './src/schemas/auth.schema';
import * as commonSchemas from './src/schemas/common';
import * as criteriaSchemas from './src/schemas/criteria.schema';
import * as hackathonSchemas from './src/schemas/hackathon.schema';
import * as leaderboardSchemas from './src/schemas/leaderboard.schema';
import * as projectSchemas from './src/schemas/project.schema';
import * as scoreSchemas from './src/schemas/score.schema';
import * as teamSchemas from './src/schemas/team.schema';
import * as userSchemas from './src/schemas/user.schema';

const allModules = {
  auth: authSchemas,
  common: commonSchemas,
  criteria: criteriaSchemas,
  hackathon: hackathonSchemas,
  leaderboard: leaderboardSchemas,
  project: projectSchemas,
  score: scoreSchemas,
  team: teamSchemas,
  user: userSchemas,
};

console.log("Testing ALL schemas...");

for (const [modName, mod] of Object.entries(allModules)) {
  for (const [key, schema] of Object.entries(mod)) {
    if (key.endsWith('Schema') || (schema as any)?._def) {
      try {
        if (!(schema as any)._def) continue; // Skip non-schemas
        zodToJsonSchema(schema as any, { target: 'openApi3' });
        // console.log(`✅ ${modName}.${key}`);
      } catch (e: any) {
        console.error(`❌ ${modName}.${key} FAILED:`, e.message);
      }
    }
  }
}
console.log("Done checking.");
