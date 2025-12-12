# Script to convert the complete catalog to the import format
# Run this to generate the complete catalogoActividades array

catalog = """
# Paste the catalog data here and run to generate formatted output
"""

# Duration conversion helper
def parse_duration(dur_str):
    if '-' in dur_str:
        return int(dur_str.split('-')[0])
    elif 'min' in dur_str.lower():
        return int(dur_str.split()[0])
    else:
        return 15  # default

# Category mappings
category_map = {
    "Activación": {
        "emoji": "⚡",
        "type": "indoor",
        "intensity": "moderada",
        "benefitType": ["Físico", "Psicológico"],
        "specificBenefits": ["Aumenta energía", "Mejora estado de ánimo", "Activa circulación"]
    },
    "Físicos/Grupal": {
        "emoji": "🎈",
        "type": "outdoor",
        "intensity": "moderada",
        "benefitType": ["Físico", "Social"],
        "specificBenefits": ["Fomenta trabajo en equipo", "Mejora coordinación", "Fomenta integración"]
    },
    "Mesa": {
        "emoji": "🎴",
        "type": "desk",
        "intensity": "baja",
        "benefitType": ["Psicológico", "Social"],
        "specificBenefits": ["Reduce estrés", "Mejora clima laboral", "Fomenta integración"]
    },
    "Digital": {
        "emoji": "🎮",
        "type": "desk",
        "intensity": "baja",
        "benefitType": ["Psicológico", "Social"],
        "specificBenefits": ["Estimula creatividad", "Mejora comunicación", "Reduce estrés"]
    },
    "Relax": {
        "emoji": "🧘",
        "type": "indoor",
        "intensity": "baja",
        "benefitType": ["Psicológico"],
        "specificBenefits": ["Reduce estrés", "Mejora concentración", "Mejora estado de ánimo"]
    },
    "Caminatas": {
        "emoji": "🚶",
        "type": "outdoor",
        "intensity": "baja",
        "benefitType": ["Físico", "Psicológico", "Social"],
        "specificBenefits": ["Reduce estrés", "Mejora concentración", "Mejora comunicación", "Activa circulación"]
    }
}

print("Catalog conversion helpers created. Ready to process full catalog.")
