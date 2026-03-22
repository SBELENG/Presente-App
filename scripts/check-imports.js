const fs = require('fs');
const path = require('path');

function checkImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkImports(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const importRegex = /from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(fullPath), importPath);
          let exists = false;
          try {
            exists = fs.existsSync(resolvedPath) || fs.existsSync(resolvedPath + '.js') || fs.existsSync(resolvedPath + '.ts') || fs.existsSync(resolvedPath + '.tsx') || fs.existsSync(resolvedPath + '.jsx') || fs.existsSync(path.join(resolvedPath, 'index.js'));
          } catch(e) {}
          if (!exists) {
            console.log(`Bad import in ${fullPath}: ${importPath}`);
          }
        }
      }
    }
  }
}

checkImports(path.join(process.cwd(), 'src'));
console.log('Check complete.');
