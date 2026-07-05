import os
import re

routes_dir = r'c:\Users\SK\Documents\RESUME\c2s-vlsi-portal\routes'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make route handlers async
    content = re.sub(r"router\.(get|post|put|delete)\(([^,]+),\s*\(req, res\) => {", r"router.\1(\2, async (req, res) => {", content)
    content = re.sub(r"router\.(get|post|put|delete)\(([^,]+),\s*authorize\([^)]+\),\s*\(req, res\) => {", r"router.\1(\2, authorize(\3), async (req, res) => {", content)
    # Fix the authorize capture group issue:
    content = re.sub(r"router\.(get|post|put|delete)\(([^,]+),\s*(authorize\([^)]+\)),\s*\(req, res\) => {", r"router.\1(\2, \3, async (req, res) => {", content)
    
    content = re.sub(r"router\.(get|post|put|delete)\(([^,]+),\s*verifyToken,\s*\(req, res\) => {", r"router.\1(\2, verifyToken, async (req, res) => {", content)

    # Convert db.prepare(query).all(...params) -> (await db.query(query, params)).rows
    content = content.replace("db.prepare(query).all(...params)", "(await db.query(query, params)).rows")
    
    # Convert db.prepare('query').all(arg1) -> (await db.query('query', [arg1])).rows
    content = re.sub(r"db\.prepare\(([^)]+)\)\.all\(([^)]*)\)", lambda m: f"(await db.query({m.group(1)}, [{m.group(2)}])).rows" if m.group(2) else f"(await db.query({m.group(1)})).rows", content)

    # Convert db.prepare('query').get(arg1, arg2) -> (await db.query('query', [arg1, arg2])).rows[0]
    content = re.sub(r"db\.prepare\(([^)]+)\)\.get\(([^)]*)\)", lambda m: f"(await db.query({m.group(1)}, [{m.group(2)}])).rows[0]" if m.group(2) else f"(await db.query({m.group(1)})).rows[0]", content)

    # Convert db.prepare('query').run(arg1) -> await db.query('query', [arg1])
    content = re.sub(r"db\.prepare\(([^)]+)\)\.run\(([^)]*)\)", lambda m: f"await db.query({m.group(1)}, [{m.group(2)}])" if m.group(2) else f"await db.query({m.group(1)})", content)

    # The above regexes will fail on multi-line template literals inside db.prepare(`...`)
    # We can handle those specifically if they exist.
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filename in os.listdir(routes_dir):
    if filename.endswith('.js') and filename != 'auth.routes.js':
        process_file(os.path.join(routes_dir, filename))

print("Done migrating!")
