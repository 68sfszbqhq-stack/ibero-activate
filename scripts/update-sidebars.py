# Python script to update sidebars in all HTML files
import os
import re

def update_file(filepath):
    print(f"Checking {filepath}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if inventory link is already there
    if 'href="inventory.html"' in content:
        print(f"Already updated: {filepath}")
        return

    # Regular expression to match the "Actividades" list item
    # Handles potential spacing, class changes, active classes, etc.
    pattern = re.compile(
        r'(<li class="nav-item">\s*<a href="activities\.html" class="nav-link\s*[^"]*">\s*<i class="fa-solid fa-dumbbell"></i>\s*Actividades\s*</a>\s*</li>)',
        re.IGNORECASE
    )

    if not pattern.search(content):
        # Fallback to a simpler match if needed
        print(f"⚠️ Could not find exact activities pattern in {filepath}")
        return

    # Replacement string inserting "Inventario" right after
    replacement = r'\1\n        <li class="nav-item">\n            <a href="inventory.html" class="nav-link">\n                <i class="fa-solid fa-boxes-stacked"></i> Inventario\n            </a>\n        </li>'
    
    new_content = pattern.sub(replacement, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"✅ Updated: {filepath}")

def main():
    paths = [
        "admin",
        "www/admin"
    ]
    for path in paths:
        if not os.path.exists(path):
            continue
        for filename in os.listdir(path):
            if filename.endswith(".html") and filename != "inventory.html":
                update_file(os.path.join(path, filename))

    # Also update sidebar template
    template_path = "admin/sidebar-template.html"
    if os.path.exists(template_path):
        update_file(template_path)

if __name__ == "__main__":
    main()
