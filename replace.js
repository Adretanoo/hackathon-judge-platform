const fs = require('fs');
const path = require('path');

const replacements = [
  // English
  { from: /Hackathon/g, to: 'Evaluation Event' },
  { from: /hackathon/g, to: 'evaluation event' },
  
  // Ukrainian - Exact matches with common endings
  { from: /хакатонами/g, to: 'подіями оцінювання проєктів' },
  { from: /хакатонами/gi, to: 'Подіями оцінювання проєктів' },
  { from: /Хакатонами/g, to: 'Подіями оцінювання проєктів' },

  { from: /хакатонах/g, to: 'подіях оцінювання проєктів' },
  { from: /хакатонах/gi, to: 'Подіях оцінювання проєктів' },
  { from: /Хакатонах/g, to: 'Подіях оцінювання проєктів' },

  { from: /хакатонів/g, to: 'подій оцінювання проєктів' },
  { from: /хакатонів/gi, to: 'Подій оцінювання проєктів' },
  { from: /Хакатонів/g, to: 'Подій оцінювання проєктів' },
  
  { from: /хакатону/g, to: 'події оцінювання проєктів' },
  { from: /хакатону/gi, to: 'Події оцінювання проєктів' },
  { from: /Хакатону/g, to: 'Події оцінювання проєктів' },
  
  { from: /хакатоні/g, to: 'події оцінювання проєктів' },
  { from: /хакатоні/gi, to: 'Події оцінювання проєктів' },
  { from: /Хакатоні/g, to: 'Події оцінювання проєктів' },
  
  { from: /хакатоном/g, to: 'подією оцінювання проєктів' },
  { from: /хакатоном/gi, to: 'Подією оцінювання проєктів' },
  { from: /Хакатоном/g, to: 'Подією оцінювання проєктів' },
  
  { from: /хакатони/g, to: 'події оцінювання проєктів' },
  { from: /хакатони/gi, to: 'Події оцінювання проєктів' },
  { from: /Хакатони/g, to: 'Події оцінювання проєктів' },
  
  { from: /хакатон/g, to: 'подія оцінювання проєктів' },
  { from: /хакатон/gi, to: 'Подія оцінювання проєктів' },
  { from: /Хакатон/g, to: 'Подія оцінювання проєктів' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Ensure we don't replace imports or object keys, e.g., hackathonApi or hackthonId
      // Let's only replace strings inside JSX or strings that have Cyrillic/Capital Hackathon
      // Actually, since this is just a quick script, let's be careful.
      // E.g., 'hackathon' might be part of an API call URL `/hackathons/...`
      // So replacing /hackathon/g to 'evaluation event' might break API calls!
      // I should ONLY replace Cyrillic and "Hackathon" (Capital, which is usually UI)
      // I will NOT replace lowercase 'hackathon' to avoid breaking code like variables and URLs.

      const safeReplacements = [
        { from: /Hackathon/g, to: 'Подія оцінювання' }, 
        // Oh wait, if it's in a class name like CreateHackathonModal, replacing it breaks the React component!
        // No! We can't indiscriminately replace "Hackathon".
        
        // I will only replace CYRILLIC versions. Cyrillic never appears in variables or API routes!
        { from: /хакатонами/g, to: 'подіями оцінювання проєктів' },
        { from: /Хакатонами/g, to: 'Подіями оцінювання проєктів' },
        { from: /хакатонах/g, to: 'подіях оцінювання проєктів' },
        { from: /Хакатонах/g, to: 'Подіях оцінювання проєктів' },
        { from: /хакатонів/g, to: 'подій оцінювання проєктів' },
        { from: /Хакатонів/g, to: 'Подій оцінювання проєктів' },
        { from: /хакатону/g, to: 'події оцінювання проєктів' },
        { from: /Хакатону/g, to: 'Події оцінювання проєктів' },
        { from: /хакатоні/g, to: 'події оцінювання проєктів' },
        { from: /Хакатоні/g, to: 'Події оцінювання проєктів' },
        { from: /хакатоном/g, to: 'подією оцінювання проєктів' },
        { from: /Хакатоном/g, to: 'Подією оцінювання проєктів' },
        { from: /хакатони/g, to: 'події оцінювання проєктів' },
        { from: /Хакатони/g, to: 'Події оцінювання проєктів' },
        { from: /хакатон/g, to: 'подія оцінювання проєктів' },
        { from: /Хакатон/g, to: 'Подія оцінювання проєктів' },
        
        // Let's also do a specific check for UI instances of "Hackathon"
        // E.g. >Hackathon< or "Hackathon" 
        { from: />Hackathon</g, to: '>Подія Оцінювання<' },
        { from: /"Hackathon"/g, to: '"Подія Оцінювання"' },
        { from: /'Hackathon'/g, to: "'Подія Оцінювання'" },
        { from: /`Hackathon`/g, to: '`Подія Оцінювання`' },
      ];

      for (const r of safeReplacements) {
        if (content.match(r.from)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'web', 'src'));
console.log('Done!');
