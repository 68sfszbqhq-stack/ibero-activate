import re

file_path = "/Users/josemendoza/proyecto ibero 2026/juegos-virtuales/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Sizes adjustments
replacements = [
    (r"\.screen \{\s*display: none;\s*width: 100%;\s*max-width: 600px;", r".screen {\n            display: none;\n            width: 100%;\n            max-width: 1000px;"),
    (r"\.header h1 \{\s*font-size: 2\.5rem;", r".header h1 {\n            font-size: 4.5rem;"),
    (r"\.header p \{\s*color: var\(--text-muted\);\s*font-size: 1\.1rem;", r".header p {\n            color: var(--text-muted);\n            font-size: 1.8rem;"),
    (r"\.timer-display \{\s*font-size: 4rem;", r".timer-display {\n            font-size: 8rem;"),
    (r"\.category \{\s*font-size: 1rem;", r".category {\n            font-size: 2rem;"),
    (r"\.word \{\s*font-size: 3\.5rem;", r".word {\n            font-size: 7rem;"),
    (r"\.cat-btn \{\s*background: #f1f5f9;\s*color: var\(--text-main\);\s*border: 2px solid transparent;\s*padding: 1\.2rem 1rem;\s*font-size: 1\.1rem;", r".cat-btn {\n            background: #f1f5f9;\n            color: var(--text-main);\n            border: 2px solid transparent;\n            padding: 1.8rem 1rem;\n            font-size: 1.6rem;"),
    (r"\.btn-game \{\s*flex: 1;\s*padding: 1\.2rem;\s*font-size: 1\.2rem;", r".btn-game {\n            flex: 1;\n            padding: 2rem;\n            font-size: 2rem;"),
    (r"\.btn-game i \{\s*font-size: 1\.8rem;", r".btn-game i {\n            font-size: 3rem;"),
    (r"\.result-number \{\s*font-size: 3\.5rem;", r".result-number {\n            font-size: 6rem;"),
    (r"\.result-label \{\s*font-size: 1\.2rem;", r".result-label {\n            font-size: 1.8rem;"),
    (r"\.word-display-container \{\s*min-height: 220px;\s*display: flex;\s*flex-direction: column;\s*justify-content: center;\s*align-items: center;\s*background: #f1f5f9;\s*border-radius: 12px;\s*padding: 2rem;", r".word-display-container {\n            min-height: 380px;\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n            background: #f1f5f9;\n            border-radius: 12px;\n            padding: 3rem;"),
    (r"\.history-item \{\s*display: flex;\s*justify-content: space-between;\s*align-items: center;\s*padding: 0\.8rem 0;\s*border-bottom: 1px solid #e2e8f0;\s*font-size: 1\.1rem;", r".history-item {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            padding: 1.2rem 0;\n            border-bottom: 1px solid #e2e8f0;\n            font-size: 1.6rem;"),
    (r"\.btn-primary \{\s*background: var\(--primary\);\s*color: white;\s*border: none;\s*padding: 1rem 2rem;\s*font-size: 1\.2rem;", r".btn-primary {\n            background: var(--primary);\n            color: white;\n            border: none;\n            padding: 1.5rem 2rem;\n            font-size: 1.8rem;"),
    (r"width: 100%; margin-top: 1rem; padding: 1rem; background: #f1f5f9; border-radius: 12px;", r"width: 100%; margin-top: 1rem; padding: 1.5rem; background: #f1f5f9; border-radius: 12px;"),
    (r"font-size: 1\.3rem; color: var\(--text-main\); font-weight: 800;", r"font-size: 2rem; color: var(--text-main); font-weight: 800;"),
    (r"\.container-box \{\s*background: var\(--card-bg\);\s*border-radius: 20px;\s*box-shadow: 0 10px 25px rgba\(0,0,0,0\.05\);\s*padding: 2\.5rem;", r".container-box {\n            background: var(--card-bg);\n            border-radius: 20px;\n            box-shadow: 0 10px 25px rgba(0,0,0,0.05);\n            padding: 4rem;"),
    (r"\.back-link \{\s*text-decoration: none;\s*color: var\(--text-muted\);\s*font-weight: 600;\s*display: flex;\s*align-items: center;\s*justify-content: center;\s*gap: 0\.5rem;\s*transition: color 0\.3s;\s*margin-top: 1\.5rem;", r".back-link {\n            text-decoration: none;\n            color: var(--text-muted);\n            font-weight: 600;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 0.5rem;\n            transition: color 0.3s;\n            margin-top: 2rem;\n            font-size: 1.5rem;")
]

for pat, rep in replacements:
    content = re.sub(pat, rep, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Tamaños actualizados.")
