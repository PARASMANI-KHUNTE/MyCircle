import re

content = open('myreport.py', encoding='utf-8').read()

# Fix 1: The broken story.append(Paragraph(...)) at lines ~2074-2083
# The string was split incorrectly across two places
bad1 = (
    "    story.append(Paragraph(\n"
    "        'This chapter provides detailed documentation of the MyCircle user interface. '\n"
    "        'Screenshot placeholder boxes represent areas where actual application screenshots '\n"
    "'description of the UI elements, layout, and user interaction flow.', ST['body']))\n"
    "\n"
    "    ph_style = TableStyle([\n"
    "        ('BOX',        (0, 0), (-1, -1), 1.5, BLUE),\n"
    "        ('BACKGROUND', (0, 0), (-1, -1), LGRAY),\n"
    "        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),\n"
    "        'description of the UI elements, layout, and user interaction flow.', ST['body']))\n"
)

good1 = (
    "    story.append(Paragraph(\n"
    "        'This chapter provides detailed documentation of the MyCircle user interface. '\n"
    "        'Screenshot placeholder boxes represent areas where actual application screenshots '\n"
    "        'are to be inserted before final submission. Each section includes a description '\n"
    "        'of the UI elements, layout, and user interaction flow.', ST['body']))\n"
    "\n"
)

if bad1 in content:
    content = content.replace(bad1, good1)
    print('Fix 1 applied')
else:
    print('Fix 1 pattern not found')

# Also remove stray ph_style TableStyle block if it still exists orphaned
bad2 = (
    "    ph_style = TableStyle([\n"
    "        ('BOX',        (0, 0), (-1, -1), 1.5, BLUE),\n"
    "        ('BACKGROUND', (0, 0), (-1, -1), LGRAY),\n"
    "        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),\n"
)
if bad2 in content:
    # Find and cut to the closing ])\n
    idx = content.find(bad2)
    end_idx = content.find("])\n", idx) + 3
    content = content[:idx] + content[end_idx:]
    print('Fix 2 applied (orphaned ph_style removed)')
else:
    print('Fix 2 not needed')

open('myreport.py', 'w', encoding='utf-8').write(content)
print('Saved.')
