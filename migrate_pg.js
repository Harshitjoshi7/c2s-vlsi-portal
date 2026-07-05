import fs from 'fs';
import path from 'path';

const routesDir = 'c:\\Users\\SK\\Documents\\RESUME\\c2s-vlsi-portal\\routes';

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');

    // Make route handlers async
    content = content.replace(/router\.(get|post|put|delete)\(([^,]+),\s*\(req, res\) => \{/g, 'router.$1($2, async (req, res) => {');
    
    // Fix authorize middleware signature
    content = content.replace(/router\.(get|post|put|delete)\(([^,]+),\s*(authorize\([^)]+\)),\s*\(req, res\) => \{/g, 'router.$1($2, $3, async (req, res) => {');
    
    content = content.replace(/router\.(get|post|put|delete)\(([^,]+),\s*verifyToken,\s*\(req, res\) => \{/g, 'router.$1($2, verifyToken, async (req, res) => {');

    // Convert db.prepare(query).all(...params)
    content = content.replace(/db\.prepare\(query\)\.all\(\.\.\.params\)/g, '(await db.prepare(query).all(...params))');
    
    // Convert db.prepare('...').all() and .all(args)
    content = content.replace(/db\.prepare\(([^)]+)\)\.all\(([^)]*)\)/g, (match, p1, p2) => {
        return p2 ? `(await db.prepare(${p1}).all(${p2}))` : `(await db.prepare(${p1}).all())`;
    });

    // Convert db.prepare('...').get() and .get(args)
    content = content.replace(/db\.prepare\(([^)]+)\)\.get\(([^)]*)\)/g, (match, p1, p2) => {
        return p2 ? `(await db.prepare(${p1}).get(${p2}))` : `(await db.prepare(${p1}).get())`;
    });

    // Convert db.prepare('...').run() and .run(args)
    content = content.replace(/db\.prepare\(([^)]+)\)\.run\(([^)]*)\)/g, (match, p1, p2) => {
        return p2 ? `(await db.prepare(${p1}).run(${p2}))` : `(await db.prepare(${p1}).run())`;
    });
    
    fs.writeFileSync(filepath, content, 'utf-8');
}

fs.readdirSync(routesDir).forEach(filename => {
    if (filename.endsWith('.js') && filename !== 'auth.routes.js') {
        processFile(path.join(routesDir, filename));
    }
});

console.log('Migration complete!');
