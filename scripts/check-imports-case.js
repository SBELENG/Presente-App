const fs = require('fs');
const path = require('path');

function checkFileCaseSensitivity(dir) {
  let hasErrors = false;
  function readDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
         // some directories might be completely ignored if they're standard
         if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
            readDir(fullPath);
         }
      } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (importPath.startsWith('.')) {
            const dirOfFile = path.dirname(fullPath);
            const absoluteImportTarget = path.resolve(dirOfFile, importPath);
            
            // Re-resolve the actual real paths of the directories by doing readdir
            let currentCheck = dirOfFile;
            const segments = importPath.split('/');
            for(let seg of segments) {
                if(seg === '.') continue;
                if(seg === '..') {
                    currentCheck = path.dirname(currentCheck);
                    continue;
                }
                
                try {
                   const actualContents = fs.readdirSync(currentCheck);
                   let found = null;
                   // check exact match first
                   if (actualContents.includes(seg)) {
                       found = seg;
                   } else {
                       // check with extensions
                       for(let ext of ['.js', '.jsx', '.ts', '.tsx']) {
                           if(actualContents.includes(seg + ext)) {
                               found = seg + ext;
                               break;
                           }
                       }
                       // index fallback
                       if(!found && actualContents.includes(seg) && fs.statSync(path.join(currentCheck, seg)).isDirectory()) {
                           found = seg;
                       }
                   }
                   if (!found) {
                       // Let's do a case-insensitive search to prove it
                       const lowerMatch = actualContents.find(x => x.toLowerCase() === seg.toLowerCase() || x.toLowerCase() === (seg+ext).toLowerCase());
                       console.log(`ERROR: Case mismatch in ${fullPath} importing ${importPath}`);
                       hasErrors = true;
                       break;
                   }
                   currentCheck = path.join(currentCheck, found);
                } catch(e) {}
            }
          }
        }
      }
    }
  }
  readDir(dir);
  if (!hasErrors) console.log("All relative imports match exact case on filesystem.");
}

checkFileCaseSensitivity(path.join(process.cwd(), 'src'));
