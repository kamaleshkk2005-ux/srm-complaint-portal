const fs = require('fs');
const path = require('path');

const directory = './src';
const enumsToExtract = ['Role', 'Priority', 'ComplaintStatus', 'TargetRole'];

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.ts')) results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const prismaImportRegex = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"];/g;
  
  content = content.replace(prismaImportRegex, (match, importsStr) => {
    let imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);
    let extracted = [];
    
    imports = imports.filter(imp => {
      if (enumsToExtract.includes(imp)) {
        extracted.push(imp);
        return false;
      }
      return true;
    });

    if (extracted.length > 0) {
      modified = true;
      let newPrismaImport = imports.length > 0 ? `import { ${imports.join(', ')} } from '@prisma/client';` : '';
      
      // Calculate relative path to src/types/enums
      let typesDir = path.resolve(__dirname, 'src/types');
      let fileDir = path.dirname(filePath);
      let relPath = path.relative(fileDir, typesDir).replace(/\\/g, '/');
      if (!relPath.startsWith('.')) relPath = './' + relPath;
      let enumsImport = `import { ${extracted.join(', ')} } from '${relPath}/enums';`;
      
      return [newPrismaImport, enumsImport].filter(Boolean).join('\n');
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

// Also process seed.ts
const seedPath = path.resolve(__dirname, 'prisma/seed.ts');
if (fs.existsSync(seedPath)) {
    processFile(seedPath);
}

walk(directory, function(err, results) {
  if (err) throw err;
  results.forEach(processFile);
  console.log('Done fixing enums.');
});
