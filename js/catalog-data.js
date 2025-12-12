
const CATALOGO_COMPLETO = [
    // ==========================================
    // SECCIÓN AF: ACTIVACIÓN FÍSICA (10)
    // ==========================================
    {
        activityId: "AF-01",
        categoria: "Activación",
        name: "Energía Express",
        objetivo: "Aumentar energía, mejorar ánimo y reducir fatiga.",
        duration: 5,
        materials: "Cronómetro, Bocina.",
        imagen: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación (Cuello, hombros, torso).",
            "3 min: Circuito (Sentadillas, Elevación rodillas, Flexiones pared, Saltos tijera).",
            "1 min: Vuelta a la calma (Estiramientos)."
        ],
        emoji: "⚡", type: "indoor", intensity: "moderada", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Aumenta energía", "Mejora ánimo", "Reduce fatiga"], description: "Rutina rápida para elevar la energía."
    },
    {
        activityId: "AF-02",
        categoria: "Activación",
        name: "Postura y Poder",
        objetivo: "Mejorar postura y fortalecer el core.",
        duration: 5,
        materials: "Cronómetro, Bocina.",
        imagen: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación (Muñecas, tobillos, torso).",
            "3 min: Circuito (Puente glúteos, Plancha, Zancadas, Elevación talones).",
            "1 min: Estiramiento (Pectorales en marco puerta, isquiotibiales)."
        ],
        emoji: "💪", type: "indoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Mejora postura", "Fortalece core"], description: "Ejercicios para la postura y el core."
    },
    {
        activityId: "AF-03",
        categoria: "Activación",
        name: "Ritmo Cardiaco",
        objetivo: "Elevar frecuencia cardiaca y oxigenación.",
        duration: 5,
        materials: "Cronómetro, Bocina.",
        imagen: "https://images.unsplash.com/photo-1538805060518-e356e22c9406?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación (Cadera, hombros, trote ligero).",
            "3 min: Circuito (Jumping Jacks, Burpees s/flexión, Rodillas altas, Sentadillas).",
            "1 min: Vuelta a la calma (Respiración profunda, cuádriceps)."
        ],
        emoji: "❤️", type: "indoor", intensity: "alta", benefitType: ["Físico"], specificBenefits: ["Cardio", "Oxigenación"], description: "Elevar el ritmo cardiaco."
    },
    {
        activityId: "AF-04",
        categoria: "Activación",
        name: "Flexibilidad Funcional",
        objetivo: "Mejorar rango de movimiento y liberar tensión.",
        duration: 5,
        materials: "Cronómetro, Bocina.",
        imagen: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación (Torso).",
            "3 min: Circuito (Zancada lateral, Gato-Vaca, Sentadilla profunda, Rotación torácica).",
            "1 min: Postura del niño y cuello."
        ],
        emoji: "🤸", type: "indoor", intensity: "baja", benefitType: ["Físico"], specificBenefits: ["Flexibilidad", "Liberar tensión"], description: "Mejorar rango de movimiento."
    },
    {
        activityId: "AF-05",
        categoria: "Activación",
        name: "Despertar Corporal",
        objetivo: "Activar grupos musculares suavemente.",
        duration: 5,
        materials: "Cronómetro, Bocina.",
        imagen: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación (Tobillos, muñecas, cadera).",
            "3 min: Circuito (Talones, Flexiones pared, Puente, Plancha codos).",
            "1 min: Estiramiento espalda alta y tríceps."
        ],
        emoji: "🌅", type: "indoor", intensity: "baja", benefitType: ["Físico"], specificBenefits: ["Activación suave"], description: "Activar el cuerpo suavemente."
    },
    {
        activityId: "AF-06",
        categoria: "Activación",
        name: "Foco y Fuerza",
        objetivo: "Fuerza con control mental.",
        duration: 5,
        materials: "Silla o pared, Cronómetro.",
        imagen: "https://images.unsplash.com/photo-1574680096141-1cddd32e04ca?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación.",
            "3 min: Sentadilla isométrica, Zancadas inv., Flexiones inclinadas, Plancha lateral.",
            "1 min: Estiramientos pectorales e isquios."
        ],
        emoji: "🎯", type: "indoor", intensity: "moderada", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Fuerza", "Control mental"], description: "Fuerza y concentración."
    },
    {
        activityId: "AF-07",
        categoria: "Activación",
        name: "Circuito Total",
        objetivo: "Trabajo de cuerpo completo equilibrado.",
        duration: 5,
        materials: "Cronómetro.",
        imagen: "https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación.",
            "3 min: Sentadillas, Plancha toque hombro, Zancadas, Rodillas altas.",
            "1 min: Estiramiento cuádriceps y espalda."
        ],
        emoji: "🔥", type: "indoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Cuerpo completo"], description: "Trabajo equilibrado."
    },
    {
        activityId: "AF-08",
        categoria: "Activación",
        name: "Mente y Movimiento",
        objetivo: "Mejorar coordinación y concentración.",
        duration: 5,
        materials: "Cronómetro.",
        imagen: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación y marcha cruzada.",
            "3 min: Saltos cruzados, Sentadilla toco pie opuesto, Zancada con giro, Plancha elevación alterna.",
            "1 min: Cuello y respiración."
        ],
        emoji: "🧠", type: "indoor", intensity: "moderada", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Coordinación", "Concentración"], description: "Coordinación y concentración."
    },
    {
        activityId: "AF-09",
        categoria: "Activación",
        name: "Cardio Ligero",
        objetivo: "Frecuencia cardiaca sostenida bajo impacto.",
        duration: 5,
        materials: "Cronómetro.",
        imagen: "https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación.",
            "3 min: Marcha rápida, Talones al glúteo, Paso lateral, Shadow boxing.",
            "1 min: Pantorrillas y tríceps."
        ],
        emoji: "👟", type: "indoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Cardio", "Bajo impacto"], description: "Cardio ligero sostenido."
    },
    {
        activityId: "AF-10",
        categoria: "Activación",
        name: "Reactivación Final",
        objetivo: "Combatir fatiga de la tarde.",
        duration: 5,
        materials: "Cronómetro.",
        imagen: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800",
        instrucciones: [
            "1 min: Lubricación.",
            "3 min: Sentadillas, Flexiones pared, Plancha, Saltos tijera.",
            "1 min: Estiramiento completo."
        ],
        emoji: "⚡", type: "indoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Combatir fatiga"], description: "Reactivación para la tarde."
    },

    // ==========================================
    // SECCIÓN FG: FÍSICOS / GRUPALES (12)
    // ==========================================
    {
        activityId: "FG-01",
        categoria: "Físicos/Grupal",
        name: "Spaghetti-Vóley",
        objetivo: "Trabajo en equipo y coordinación.",
        duration: 15,
        materials: "Tubos de espuma, globo o pelota.",
        imagen: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800",
        instrucciones: [
            "Dividir equipos con línea imaginaria.",
            "Pasar el globo usando solo los spaguetis.",
            "Si cae, punto para el rival."
        ],
        emoji: "🎈", type: "outdoor", intensity: "moderada", benefitType: ["Social", "Físico"], specificBenefits: ["Trabajo en equipo", "Coordinación"], description: "Vóley con tubos de espuma."
    },
    {
        activityId: "FG-02",
        categoria: "Físicos/Grupal",
        name: "Precisión-Pong",
        objetivo: "Concentración y motricidad fina.",
        duration: 10,
        materials: "Pelotas ping pong, vasos/aros.",
        imagen: "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?q=80&w=800",
        instrucciones: [
            "Colocar vasos a distintas distancias.",
            "Lanzar pelotas (directo o con bote) para encestar.",
            "Asignar puntos según dificultad."
        ],
        emoji: "🎯", type: "indoor", intensity: "baja", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Concentración", "Motricidad fina"], description: "Juego de puntería."
    },
    {
        activityId: "FG-03",
        categoria: "Físicos/Grupal",
        name: "Mini Bádminton",
        objetivo: "Precisión y paciencia.",
        duration: 15,
        materials: "Set portátil, raquetas, gallitos.",
        imagen: "https://images.unsplash.com/photo-1626224583764-847649623d9c?q=80&w=800",
        instrucciones: [
            "Armar cancha en espacio reducido.",
            "Partidos básicos buscando que caiga en lado contrario."
        ],
        emoji: "🏸", type: "outdoor", intensity: "moderada", benefitType: ["Físico", "Social"], specificBenefits: ["Precisión", "Paciencia"], description: "Bádminton en espacio reducido."
    },
    {
        activityId: "FG-04",
        categoria: "Físicos/Grupal",
        name: "Rebote-Reto",
        objetivo: "Velocidad de reacción.",
        duration: 10,
        materials: "Pelota de tenis, pared.",
        imagen: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800",
        instrucciones: [
            "Grupo en semicírculo frente a pared.",
            "Lanzar pelota y gritar nombre de alguien.",
            "La persona nombrada debe atraparla antes del segundo bote."
        ],
        emoji: "🎾", type: "outdoor", intensity: "moderada", benefitType: ["Físico", "Social"], specificBenefits: ["Reacción", "Atención"], description: "Juego de reacción con pelota."
    },
    {
        activityId: "FG-05",
        categoria: "Físicos/Grupal",
        name: "Círculo de Toques",
        objetivo: "Cooperación y comunicación no verbal.",
        duration: 10,
        materials: "Pelota de playa/globo.",
        imagen: "https://images.unsplash.com/photo-1533561098687-9d7fc240bd3b?q=80&w=800",
        instrucciones: [
            "Mantener la pelota en el aire en círculo.",
            "Usar cualquier parte del cuerpo.",
            "Contar toques consecutivos."
        ],
        emoji: "⭕", type: "outdoor", intensity: "baja", benefitType: ["Social", "Físico"], specificBenefits: ["Cooperación", "Comunicación"], description: "Mantener pelota en el aire."
    },
    {
        activityId: "FG-06",
        categoria: "Físicos/Grupal",
        name: "El Globo Loco",
        objetivo: "Risas y reflejos.",
        duration: 10,
        materials: "Globos, pelota ping pong dentro.",
        imagen: "https://images.unsplash.com/photo-1505235689459-d8b519e283e1?q=80&w=800",
        instrucciones: [
            "Introducir pelota en globo antes de inflar (vuelo errático).",
            "Evitar que toque el suelo en grupo."
        ],
        emoji: "🎈", type: "indoor", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Gestión estrés", "Reflejos"], description: "Juego con globos erráticos."
    },
    {
        activityId: "FG-07",
        categoria: "Físicos/Grupal",
        name: "Hockey de Suelo",
        objetivo: "Estrategia y cardio.",
        duration: 15,
        materials: "Spaguetis, pelota/disco plástico.",
        imagen: "https://images.unsplash.com/photo-1515523110528-5ce4e325bf77?q=80&w=800",
        instrucciones: [
            "Usar spaguetis como palos.",
            "Marcar porterías con sillas.",
            "Meter gol en portería contraria."
        ],
        emoji: "🏒", type: "outdoor", intensity: "moderada", benefitType: ["Físico", "Social"], specificBenefits: ["Cardio", "Estrategia"], description: "Hockey simple."
    },
    {
        activityId: "FG-09",
        categoria: "Físicos/Grupal",
        name: "Relevo de Equilibrio",
        objetivo: "Equilibrio y paciencia.",
        duration: 10,
        materials: "Pelotas tenis, gallitos.",
        imagen: "https://images.unsplash.com/photo-1516147696185-3ba529ef8849?q=80&w=800",
        instrucciones: [
            "Carrera de relevos.",
            "Llevar gallito equilibrado sobre pelota de tenis.",
            "Si cae, regresar al inicio."
        ],
        emoji: "⚖️", type: "outdoor", intensity: "baja", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Equilibrio", "Paciencia"], description: "Relevos con equilibrio."
    },
    {
        activityId: "FG-09b",
        categoria: "Físicos/Grupal",
        name: "Pelotas a la Pared",
        objetivo: "Agilidad y ritmo.",
        duration: 10,
        materials: "Pelota de plástico.",
        imagen: "https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=800",
        instrucciones: [
            "Golpear pelota contra pared sin perder ritmo.",
            "Vencer retos de golpes seguidos (10, 15, 20...)."
        ],
        emoji: "🧱", type: "outdoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Agilidad", "Ritmo"], description: "Ritmo y agilidad con pared."
    },
    {
        activityId: "FG-10",
        categoria: "Físicos/Grupal",
        name: "Estación de Habilidades",
        objetivo: "Diversidad motora.",
        duration: 15,
        materials: "Mix de materiales.",
        imagen: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=800",
        instrucciones: [
            "Circuito de 3 estaciones.",
            "1: Spagueti + Globo.",
            "2: Tenis pared.",
            "3: Precisión vasos."
        ],
        emoji: "🎪", type: "outdoor", intensity: "moderada", benefitType: ["Físico"], specificBenefits: ["Motricidad", "Diversidad"], description: "Circuito de habilidades."
    },
    {
        activityId: "FG-12",
        categoria: "Físicos/Grupal",
        name: "Mini Voleibol",
        objetivo: "Activación en espacio reducido.",
        duration: 15,
        materials: "Red portátil, pelota suave.",
        imagen: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800",
        instrucciones: [
            "Versión simplificada del voleibol.",
            "Pasar balón sin que toque suelo.",
            "Sin raquetas, uso de manos."
        ],
        emoji: "🏐", type: "outdoor", intensity: "moderada", benefitType: ["Físico", "Social"], specificBenefits: ["Activación", "Equipo"], description: "Voleibol simplificado."
    },

    // ==========================================
    // SECCIÓN JM: JUEGOS DE MESA (17)
    // ==========================================
    {
        activityId: "JM-01",
        categoria: "Mesa",
        name: "Hockey de Mesa",
        objetivo: "Reflejos y coordinación.",
        duration: 10,
        materials: "Juego Mini Hockey.",
        imagen: "https://images.unsplash.com/photo-1593165239247-49f390099443?q=80&w=800",
        instrucciones: ["Marcar goles usando palancas/discos."],
        emoji: "🏒", type: "desk", intensity: "baja", benefitType: ["Psicológico", "Social"], specificBenefits: ["Reflejos", "Diversión"], description: "Hockey de mesa rápido."
    },
    {
        activityId: "JM-02",
        categoria: "Mesa",
        name: "Lotería",
        objetivo: "Integración y atención.",
        duration: 15,
        materials: "Tablas y fichas.",
        imagen: "https://images.unsplash.com/photo-1630946263725-3037998ce774?q=80&w=800",
        instrucciones: ["Gritón canta cartas, jugadores marcan."],
        emoji: "🃏", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Integración", "Atención"], description: "Lotería tradicional."
    },
    {
        activityId: "JM-03",
        categoria: "Mesa",
        name: "Basta",
        objetivo: "Agilidad mental.",
        duration: 10,
        materials: "Juego Basta o Papel/Lápiz.",
        imagen: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=800",
        instrucciones: ["Escribir palabras de categorías con una letra específica."],
        emoji: "📝", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Agilidad mental"], description: "Juego de palabras."
    },
    {
        activityId: "JM-04",
        categoria: "Mesa",
        name: "UNO Clásico",
        objetivo: "Estrategia simple.",
        duration: 15,
        materials: "Cartas UNO.",
        imagen: "https://images.unsplash.com/photo-1605304383472-3c2243e39c4f?q=80&w=800",
        instrucciones: ["Coincidir color/número. Gana quien se quede sin cartas."],
        emoji: "🎴", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Estrategia", "Diversión"], description: "Juego de cartas UNO."
    },
    {
        activityId: "JM-05",
        categoria: "Mesa",
        name: "Adivina la Palabra",
        objetivo: "Comunicación creativa.",
        duration: 10,
        materials: "App (Heads Up!) o tarjetas.",
        imagen: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=800",
        instrucciones: ["Jugador con tarjeta en frente adivina con pistas del equipo."],
        emoji: "🤔", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Comunicación", "Creatividad"], description: "Adivinanzas en equipo."
    },
    {
        activityId: "JM-06",
        categoria: "Mesa",
        name: "Ping Pong con Tablas",
        objetivo: "Creatividad y reflejos.",
        duration: 15,
        materials: "Tablas/Libros, red, pelota.",
        imagen: "https://images.unsplash.com/photo-1534158914592-062992bbe900?q=80&w=800",
        instrucciones: ["Usar tablas de oficina como raquetas sobre mesa de juntas."],
        emoji: "🏓", type: "desk", intensity: "moderada", benefitType: ["Físico", "Social"], specificBenefits: ["Reflejos", "Creatividad"], description: "Ping pong improvisado."
    },
    {
        activityId: "JM-07",
        categoria: "Mesa",
        name: "The Mind",
        objetivo: "Conexión mental y silencio.",
        duration: 15,
        materials: "Cartas The Mind.",
        imagen: "https://images.unsplash.com/photo-1611371805429-921e73703dc7?q=80&w=800",
        instrucciones: ["Jugar cartas en orden ascendente sin hablar."],
        emoji: "😶", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Conexión", "Trabajo en equipo"], description: "Juego colaborativo silencioso."
    },
    {
        activityId: "JM-08",
        categoria: "Mesa",
        name: "Torre Jenga",
        objetivo: "Pulso y paciencia.",
        duration: 15,
        materials: "Jenga.",
        imagen: "https://images.unsplash.com/photo-1494451930944-8998635c2123?q=80&w=800",
        instrucciones: ["Retirar bloques y colocarlos arriba sin derribar."],
        emoji: "🧱", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Pulso", "Paciencia"], description: "Torre de equilibrio."
    },
    {
        activityId: "JM-09",
        categoria: "Mesa",
        name: "Spot It (Dobble)",
        objetivo: "Agudeza visual.",
        duration: 5,
        materials: "Cartas Dobble.",
        imagen: "https://images.unsplash.com/photo-1611371805429-921e73703dc7?q=80&w=800",
        instrucciones: ["Encontrar símbolo repetido entre dos cartas."],
        emoji: "👀", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Agudeza visual", "Rapidez"], description: "Juego de rapidez visual."
    },
    {
        activityId: "JM-10",
        categoria: "Mesa",
        name: "Bananagrams",
        objetivo: "Vocabulario rápido.",
        duration: 10,
        materials: "Fichas letras.",
        imagen: "https://images.unsplash.com/photo-1596464716127-f9a0859b4afd?q=80&w=800",
        instrucciones: ["Formar crucigrama propio antes que los demás."],
        emoji: "🍌", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Vocabulario", "Velocidad"], description: "Crucigrama rápido."
    },
    {
        activityId: "JM-11",
        categoria: "Mesa",
        name: "Crazy Tower",
        objetivo: "Estrategia y equilibrio.",
        duration: 15,
        materials: "Bloques Crazy Tower.",
        imagen: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=800",
        instrucciones: ["Construir torre siguiendo cartas de restricción."],
        emoji: "🗼", type: "desk", intensity: "baja", benefitType: ["Psicológico", "Social"], specificBenefits: ["Estrategia", "Equilibrio"], description: "Torre estratégica."
    },
    {
        activityId: "JM-12",
        categoria: "Mesa",
        name: "UNO No Mercy",
        objetivo: "Resiliencia y competencia.",
        duration: 20,
        materials: "Mazo No Mercy.",
        imagen: "https://images.unsplash.com/photo-1605304383472-3c2243e39c4f?q=80&w=800",
        instrucciones: ["UNO agresivo con cartas de 'Toma 10' y apilables."],
        emoji: "👿", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Resiliencia", "Competencia"], description: "Versión intensa de UNO."
    },
    {
        activityId: "JM-14",
        categoria: "Mesa",
        name: "Polilla Tramposa",
        objetivo: "Astucia y desinhibición.",
        duration: 15,
        materials: "Cartas Polilla.",
        imagen: "https://images.unsplash.com/photo-1500995617113-cf789362a3e1?q=80&w=800",
        instrucciones: ["Deshacerse de cartas, ¡hacer trampa está permitido!"],
        emoji: "🦋", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Astucia", "Desinhibición"], description: "Juego de trampas."
    },
    {
        activityId: "JM-18",
        categoria: "Mesa",
        name: "Dominó Tren Mexicano",
        objetivo: "Estrategia lógica.",
        duration: 20,
        materials: "Dominó doble 12.",
        imagen: "https://images.unsplash.com/photo-1555708982-8645ec9ce3cc?q=80&w=800",
        instrucciones: ["Conectar fichas en trenes propios o el público."],
        emoji: "🚂", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Lógica", "Estrategia"], description: "Dominó avanzado."
    },
    {
        activityId: "JM-20",
        categoria: "Mesa",
        name: "Taco Gato Cabra...",
        objetivo: "Velocidad y risas.",
        duration: 10,
        materials: "Cartas.",
        imagen: "https://images.unsplash.com/photo-1609355444853-27dc24ebc0a6?q=80&w=800",
        instrucciones: ["Decir palabra, si coincide con carta, golpear el centro."],
        emoji: "🌮", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Velocidad", "Risas"], description: "Juego de reacción en cadena."
    },
    {
        activityId: "JM-21",
        categoria: "Mesa",
        name: "Fantasma Blitz",
        objetivo: "Inhibición y reflejos.",
        duration: 10,
        materials: "Objetos y cartas.",
        imagen: "https://images.unsplash.com/photo-1611371805429-921e73703dc7?q=80&w=800",
        instrucciones: ["Agarrar el objeto correcto (o el que falta) según la carta."],
        emoji: "👻", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Reflejos", "Inhibición"], description: "Juego de reconocimiento."
    },
    {
        activityId: "JM-21b",
        categoria: "Mesa",
        name: "That's Not a Hat",
        objetivo: "Memoria y engaño.",
        duration: 15,
        materials: "Cartas regalo.",
        imagen: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=800",
        instrucciones: ["Recordar regalos y pasarlos, o mentir si olvidaste."],
        emoji: "🎁", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Memoria", "Engaño"], description: "Juego de memoria."
    },
    {
        activityId: "JM-22",
        categoria: "Mesa",
        name: "Exploding Kittens",
        objetivo: "Gestión de riesgo.",
        duration: 15,
        materials: "Cartas.",
        imagen: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=800",
        instrucciones: ["Evitar cartas bomba, usar herramientas para desactivar."],
        emoji: "🐱", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Gestión riesgo", "Estrategia"], description: "Juego de cartas explosivo."
    },

    // ==========================================
    // SECCIÓN VD: VIDEOJUEGOS / DIGITAL (4)
    // ==========================================
    {
        activityId: "VD-01",
        categoria: "Digital",
        name: "Mario Party",
        objetivo: "Competencia amistosa.",
        duration: 20,
        materials: "Nintendo Switch.",
        imagen: "https://images.unsplash.com/photo-1612287230217-12740411898d?q=80&w=800",
        instrucciones: ["Minijuegos de habilidad y suerte para ganar estrellas."],
        emoji: "🍄", type: "desk", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Competencia", "Diversión"], description: "Minijuegos digitales."
    },
    {
        activityId: "VD-02",
        categoria: "Digital",
        name: "Jeopardy / Switch 1-2",
        objetivo: "Conocimiento o movimiento.",
        duration: 15,
        materials: "Proyector o Switch.",
        imagen: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=800",
        instrucciones: ["Trivia institucional o juegos de movimiento masivo."],
        emoji: "🎮", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Conocimiento", "Movimiento"], description: "Juegos interactivos."
    },
    {
        activityId: "VD-03",
        categoria: "Digital",
        name: "Basta Digital",
        objetivo: "Velocidad mental.",
        duration: 10,
        materials: "iPad/Web.",
        imagen: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800",
        instrucciones: ["Llenar categorías con una letra (stopots.com)."],
        emoji: "💻", type: "desk", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Agilidad mental"], description: "Basta en versión digital."
    },
    {
        activityId: "VD-04",
        categoria: "Digital",
        name: "Pictionary Air",
        objetivo: "Creatividad.",
        duration: 15,
        materials: "Lápiz digital, TV.",
        imagen: "https://images.unsplash.com/photo-1589330694653-4a8b2435964c?q=80&w=800",
        instrucciones: ["Dibujar en el aire, equipo adivina en pantalla."],
        emoji: "✏️", type: "desk", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Creatividad", "Trabajo en equipo"], description: "Dibujo digital en aire."
    },

    // ==========================================
    // SECCIÓN RC: RELAJACIÓN Y CONEXIÓN (5)
    // ==========================================
    {
        activityId: "RC-01",
        categoria: "Relax",
        name: "Círculo Agradecimiento",
        objetivo: "Lazos y gratitud.",
        duration: 10,
        materials: "Espacio abierto.",
        imagen: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800",
        instrucciones: ["Dos círculos rotativos, agradecer al compañero enfrente."],
        emoji: "🙏", type: "indoor", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Gratitud", "Conexión"], description: "Dinámica de gratitud."
    },
    {
        activityId: "RC-02",
        categoria: "Relax",
        name: "Meditación Guiada",
        objetivo: "Calma mental.",
        duration: 10,
        materials: "Audio, sillas.",
        imagen: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800",
        instrucciones: ["Ojos cerrados, seguir guía de respiración."],
        emoji: "🧘", type: "indoor", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Calma", "Reducción estrés"], description: "Meditación básica."
    },
    {
        activityId: "RC-03",
        categoria: "Relax",
        name: "Estiramientos Funcionales",
        objetivo: "Alivio muscular.",
        duration: 10,
        materials: "Sillas/Pie.",
        imagen: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800",
        instrucciones: ["Estirar cuello, espalda y muñecas guiados."],
        emoji: "🙆", type: "indoor", intensity: "baja", benefitType: ["Físico"], specificBenefits: ["Alivio muscular", "Flexibilidad"], description: "Estiramientos suaves."
    },
    {
        activityId: "RC-04",
        categoria: "Relax",
        name: "Automasaje Pelotas",
        objetivo: "Liberar nudos.",
        duration: 10,
        materials: "Pelotas tenis, pared.",
        imagen: "https://images.unsplash.com/photo-1544367563-12123d832d61?q=80&w=800",
        instrucciones: ["Presionar pelota contra pared con espalda u hombros."],
        emoji: "🎾", type: "indoor", intensity: "baja", benefitType: ["Físico"], specificBenefits: ["Liberación miofascial", "Relajación"], description: "Masaje con pelotas."
    },
    {
        activityId: "RC-06",
        categoria: "Relax",
        name: "Yoga en Silla",
        objetivo: "Flexibilidad accesible.",
        duration: 10,
        materials: "Sillas estables.",
        imagen: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=800",
        instrucciones: ["Posturas de gato-vaca, torsiones y estiramientos sentados."],
        emoji: "🪑", type: "indoor", intensity: "baja", benefitType: ["Físico", "Psicológico"], specificBenefits: ["Flexibilidad", "Relajación"], description: "Yoga adaptado a silla."
    },

    // ==========================================
    // SECCIÓN CR: CAMINATAS REFLEXIVAS (4)
    // ==========================================
    {
        activityId: "CR-01",
        categoria: "Caminata",
        name: "Caminata Consciente",
        objetivo: "Conexión y reflexión.",
        duration: 15,
        materials: "Ruta segura.",
        imagen: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800",
        instrucciones: ["Caminar en parejas respondiendo preguntas de conexión."],
        emoji: "🚶", type: "outdoor", intensity: "baja", benefitType: ["Social", "Psicológico"], specificBenefits: ["Conexión", "Reflexión"], description: "Caminata guiada."
    },
    {
        activityId: "CR-02",
        categoria: "Caminata",
        name: "Diario de Gratitud",
        objetivo: "Introspección.",
        duration: 10,
        materials: "Libreta/Hojas.",
        imagen: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800",
        instrucciones: ["Escribir 3 cosas por agradecer y 1 intención."],
        emoji: "📓", type: "outdoor", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Gratitud", "Introspección"], description: "Escritura reflexiva."
    },
    {
        activityId: "CR-03",
        categoria: "Caminata",
        name: "Cartas al Universo",
        objetivo: "Clarificar metas.",
        duration: 10,
        materials: "Papel, caja.",
        imagen: "https://images.unsplash.com/photo-1555445054-01f27236a88e?q=80&w=800",
        instrucciones: ["Escribir deseos/metas y guardarlas simbólicamente."],
        emoji: "✉️", type: "outdoor", intensity: "baja", benefitType: ["Psicológico"], specificBenefits: ["Claridad", "Proyección"], description: "Cartas de intención."
    },
    {
        activityId: "CR-04",
        categoria: "Caminata",
        name: "Tarjetas 'Somos'",
        objetivo: "Empatía profunda.",
        duration: 10,
        materials: "Mazo Somos.",
        imagen: "https://images.unsplash.com/photo-1521791136064-7986c2920277?q=80&w=800",
        instrucciones: ["Responder preguntas profundas en grupos pequeños."],
        emoji: "🃏", type: "outdoor", intensity: "baja", benefitType: ["Social"], specificBenefits: ["Empatía", "Conexión"], description: "Juego de preguntas profundas."
    }
];
