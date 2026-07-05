import os
import glob
import re

pages_dir = r"C:\Users\SK\Documents\RESUME\c2s-vlsi-portal\public\js\pages"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace 4-column stats grid
    content = content.replace(
        'style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md);margin-bottom:var(--space-lg)"',
        'class="grid grid-stats" style="margin-bottom:var(--space-lg)"'
    )
    content = content.replace(
        'style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-md);margin-bottom:var(--space-xl)" id="reportStats"',
        'class="grid grid-stats" style="margin-bottom:var(--space-xl)" id="reportStats"'
    )
    # Replace 3-column stats grid (users.js)
    content = content.replace(
        'style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-md);margin-bottom:var(--space-lg)" id="userStats"',
        'class="grid grid-stats" style="margin-bottom:var(--space-lg)" id="userStats"'
    )

    # Replace 2-column forms/grids
    content = content.replace(
        'style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)"',
        'class="grid grid-2" style="gap:var(--space-md)"'
    )
    content = content.replace(
        'style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-md)"',
        'class="grid grid-2" style="gap:var(--space-md);margin-bottom:var(--space-md)"'
    )

    # Replace specific 1fr 300px grid in daily-logs.js
    content = content.replace(
        'class="grid" style="grid-template-columns:1fr 300px;gap:var(--space-lg)"',
        'class="grid grid-dashboard"'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in glob.glob(os.path.join(pages_dir, '*.js')):
    replace_in_file(filepath)

print("Replacement complete.")
