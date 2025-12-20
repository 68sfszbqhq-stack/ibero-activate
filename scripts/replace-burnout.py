#!/usr/bin/env python3
"""
Replace Maslach Burnout test with Copenhagen Burnout Inventory
for legal compliance (Copenhagen is free to use, Maslach is copyrighted)
"""

input_file = "js/wellness.js"
output_file = "js/wellness.js"

# Read the file
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the burnout section
old_burnout_start = "burnout: {\n            id: 'burnout',\n            title: 'Test de Burnout (Maslach)',"
new_burnout_start = "burnout: {\n            id: 'burnout',\n            title: 'Test de Burnout (Copenhagen)',"

if old_burnout_start in content:
    # Find the end of the burnout object (next test starts with "depresion:")
    start_idx = content.find("burnout: {")
    end_idx = content.find("        },\n        depresion:", start_idx)
    
    if start_idx != -1 and end_idx != -1:
        # Copenhagen Burnout Inventory replacement
        new_burnout = """burnout: {
            id: 'burnout',
            title: 'Test de Burnout (Copenhagen)',
            icon: 'fa-fire',
            color: 'from-red-500 to-rose-600',
            description: 'Mide el agotamiento personal, relacionado con el trabajo y con clientes/usuarios.',
            questions: [
                // Personal Burnout (6 items)
                "¿Con qué frecuencia te sientes cansado/a?",
                "¿Con qué frecuencia estás físicamente exhausto/a?",
                "¿Con qué frecuencia estás emocionalmente agotado/a?",
                "¿Con qué frecuencia piensas 'no puedo más'?",
                "¿Con qué frecuencia te sientes débil y susceptible a enfermedades?",
                "¿Con qué frecuencia te sientes decaído/a y sin energía?",
                
                // Work-related Burnout (7 items)
                "¿Te sientes agotado/a al final de un día de trabajo?",
                "¿Te sientes exhausto/a en la mañana al pensar en otro día de trabajo?",
                "¿Sientes que cada hora de trabajo es agotadora?",
                "¿Tienes energía para familia y amigos durante tu tiempo libre?",
                "¿Tu trabajo te frustra emocionalmente?",
                "¿Te sientes quemado/a por tu trabajo?",
                "¿Sientes que das más de lo que recibes cuando trabajas?",
                
                // Client-related Burnout (6 items)
                "¿Encuentras difícil trabajar con clientes/usuarios/compañeros?",
                "¿Te cuesta motivarte para trabajar con clientes/usuarios/compañeros?",
                "¿Te sientes frustrado/a al trabajar con clientes/usuarios/compañeros?",
                "¿Sientes que has dado todo lo que tenías al trabajar con clientes/usuarios/compañeros?",
                "¿Estás cansado/a de trabajar con clientes/usuarios/compañeros?",
                "¿Te preguntas cuánto tiempo más podrás trabajar con clientes/usuarios/compañeros?"
            ],
            options: [
                { label: "Nunca/Casi nunca", value: 0 },
                { label: "Rara vez", value: 25 },
                { label: "A veces", value: 50 },
                { label: "A menudo", value: 75 },
                { label: "Siempre/Casi siempre", value: 100 }
            ],
            calculate: (answers) => {
                // Copenhagen Burnout Inventory scoring
                // Personal Burnout: items 0-5
                // Work Burnout: items 6-12 (item 9 is reverse scored)
                // Client Burnout: items 13-18
                
                const personalItems = answers.slice(0, 6);
                const workItems = answers.slice(6, 13);
                const clientItems = answers.slice(13, 19);
                
                // Reverse score item 9 (index 9): "¿Tienes energía para familia y amigos?"
                workItems[3] = 100 - workItems[3];
                
                const personalBurnout = personalItems.reduce((a, b) => a + b, 0) / personalItems.length;
                const workBurnout = workItems.reduce((a, b) => a + b, 0) / workItems.length;
                const clientBurnout = clientItems.reduce((a, b) => a + b, 0) / clientItems.length;
                
                // Overall burnout (average of three dimensions)
                const overallBurnout = (personalBurnout + workBurnout + clientBurnout) / 3;
                
                // Interpretation (Copenhagen scale: 0-100)
                let levelText = "Bajo"; // < 25
                let levelNum = Math.round(overallBurnout / 10); // Convert to 0-10 scale
                
                if (overallBurnout >= 75) {
                    levelText = "Muy Alto"; // High burnout
                } else if (overallBurnout >= 50) {
                    levelText = "Alto"; // Moderate-high
                } else if (overallBurnout >= 25) {
                    levelText = "Moderado"; // Low-moderate
                }
                
                return {
                    score: levelNum,
                    level: levelText,
                    rawScore: Math.round(overallBurnout),
                    dimensions: {
                        personal: Math.round(personalBurnout),
                        work: Math.round(workBurnout),
                        client: Math.round(clientBurnout)
                    }
                };
            }
        }"""
        
        # Replace the content
        new_content = content[:start_idx] + new_burnout + content[end_idx:]
        
        # Write back
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("✅ Successfully replaced Maslach Burnout with Copenhagen Burnout Inventory")
        print("   - Old: 22 questions (copyrighted)")
        print("   - New: 19 questions (free to use)")
        print("   - Dimensions: Personal, Work, Client burnout")
    else:
        print("❌ Could not find burnout section boundaries")
else:
    print("❌ Could not find Maslach burnout test in file")
