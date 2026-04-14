const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) {
      let content = fs.readFileSync(full, 'utf8');
      
      const safeReplacements = [
        { from: '>Hackathon<', to: '>Подія Оцінювання<' },
        { from: '"Hackathon"', to: '"Подія Оцінювання"' },
        { from: "'Hackathon'", to: "'Подія Оцінювання'" },
        { from: '`Hackathon`', to: '`Подія Оцінювання`' },
        
        { from: '>Hackathons<', to: '>Події Оцінювання<' },
        { from: '"Hackathons"', to: '"Події Оцінювання"' },
        { from: "'Hackathons'", to: "'Події Оцінювання'" },
        { from: '`Hackathons`', to: '`Події Оцінювання`' }
      ];
      
      let changed = false;
      for (const r of safeReplacements) {
        if (content.split(r.from).length > 1) {
          content = content.split(r.from).join(r.to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(full, content);
        console.log('Fixed UI literal in', full);
      }
    }
  }
}
walk('./web/src');
console.log('UI literal script done!');
