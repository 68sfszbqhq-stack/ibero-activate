
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
        activityId: 'FG-01',
        categoria: 'Físicos/Grupal',
        name: 'Spaghetti-Vóley',
        objetivo: 'Trabajo en equipo y coordinación.',
        duration: 15,
        materials: 'Tubos de espuma (spaguetis) y una pelota inflable de playa.',
        instrucciones: [
            'Dos equipos separados por una línea en el piso marcada con spaguetis.',
            'La pelota de playa se pasa golpeándola SOLO con el spagueti, nunca con las manos.',
            'Si toca el suelo del lado contrario, es punto.',
            'Sets cortos a 10 puntos para que roten todos.'
        ],
        emoji: '🎈', type: 'outdoor', intensity: 'moderada', benefitType: ['Social', 'Físico'], specificBenefits: ['Trabajo en equipo', 'Coordinación'], description: 'Primer deporte adaptado del periodo y paso previo al torneo de voleibol de la semana 10. El tubo de espuma y la pelota de playa quitan por completo el miedo a no saber jugar: la pelota baja lento, no lastima y nadie queda expuesto por fallar un golpe. Sirve para que la gente que nunca ha jugado voleibol entienda la dinámica de pasar y sostener el balón en el aire antes de tomarlo con las manos.'
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
        activityId: 'FG-05',
        categoria: 'Físicos/Grupal',
        name: 'Círculo de Toques',
        objetivo: 'Cooperación y comunicación no verbal.',
        duration: 10,
        materials: 'Una pelota inflable de playa.',
        instrucciones: [
            'Todo el grupo en círculo, de pie.',
            'Sostener la pelota en el aire usando cualquier parte del cuerpo.',
            'Contar en voz alta los toques consecutivos del grupo.',
            'Cada ronda se busca superar el récord anterior del área.'
        ],
        emoji: '⭕', type: 'outdoor', intensity: 'moderada', benefitType: ['Físico', 'Social'], specificBenefits: ['Mejora postura', 'Reduce dolor muscular', 'Mejora movilidad', 'Activa circulación', 'Mejora flexibilidad', 'Reduce estrés', 'Fomenta trabajo en equipo', 'Mejora clima laboral', 'Fomenta integración', 'Mejora comunicación'], description: 'Reto cooperativo donde el marcador es del grupo entero, no de nadie en particular: se cuenta cuántos toques logra sostener el equipo sin que la pelota caiga. La pelota de playa es lenta y ligera, así que participa igual quien tiene condición y quien no, y a nadie se le culpa por el fallo porque el conteo es colectivo. Refuerza la mecánica de toque que se usará en el torneo de voleibol.'
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
        activityId: 'FG-12',
        categoria: 'Físicos/Grupal',
        name: 'Mini Voleibol',
        objetivo: 'Activación en espacio reducido.',
        duration: 15,
        materials: 'La pelota de voleibol de plástico. La red del set de bádminton, o una línea de spaguetis en el piso si no se monta.',
        instrucciones: [
            'Equipos por área, cancha delimitada con la red de bádminton o con spaguetis en el piso.',
            'Se permite dejar botar la pelota una vez: baja la exigencia y alarga las jugadas.',
            'Máximo tres toques por equipo antes de pasarla.',
            'Sets a 10 puntos, rotación obligatoria en cada saque para que todos toquen la pelota.',
            'Viernes: llaves de eliminación entre áreas y marcador en el pizarrón portátil.'
        ],
        emoji: '🏐', type: 'outdoor', intensity: 'moderada', benefitType: ['Físico', 'Social'], specificBenefits: ['Activa circulación', 'Aumenta energía', 'Fomenta trabajo en equipo', 'Mejora comunicación'], description: 'El torneo que pidieron los propios participantes y el pico de participación del periodo. Cierra la progresión que empezó en la semana 4 con el Spaghetti-Vóley y siguió en la 6 con el Círculo de Toques: primero se aprende a sostener la pelota en el aire con ayuda, después con el cuerpo, y aquí ya se juega el partido real con la pelota de plástico. Las dos reglas adaptadas (se vale un bote y rotación obligatoria) existen para que jueguen también quienes nunca han practicado voleibol, que es la mayoría del personal administrativo.'
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
        activityId: 'RC-04',
        categoria: 'Relax',
        name: 'Automasaje con Pelota',
        objetivo: 'Liberar puntos de tensión muscular y enseñar una herramienta de autocuidado que cada quien pueda repetir solo.',
        duration: 10,
        materials: 'Una pelota de tenis por persona y una pared. Las 36 pelotas del archivero son de uso exclusivo para esto: no se usan en juegos ni se ensucian en el piso.',
        instrucciones: [
            'PLANTA DEL PIE (1 min por pie). De pie, apoyo ligero sobre la pelota y rodarla del talón a los dedos, lento. Al encontrar un punto sensible, detenerse y sostener 20 segundos respirando.',
            'PANTORRILLA (1 min por pierna). Sentado, tobillo cruzado sobre la rodilla contraria, con la pelota entre la pantorrilla y el muslo. Presionar y hacer círculos pequeños.',
            'GLÚTEO (1 min por lado). Sentado sobre la pelota, inclinar el peso hacia un lado hasta encontrar el punto y sostener sin rebotar.',
            'ESPALDA ALTA (2 min). Pelota entre la pared y el omóplato. Flexionar y estirar las rodillas para que la pelota recorra la zona. Nunca sobre la columna: siempre a un costado de ella.',
            'TRAPECIO Y CUELLO (1 min por lado). Misma posición contra la pared, pelota entre el hombro y la oreja. Presión suave, girando despacio la cabeza al lado contrario.',
            'PECTORAL (1 min por lado). Pelota entre la pared y la parte alta del pecho, cerca del hombro. Es la zona que más se acorta al estar encorvado frente a la computadora.',
            'ANTEBRAZO (1 min). Pelota sobre el escritorio, rodar el antebrazo encima con la palma hacia abajo. Alivia a quien teclea o usa el ratón todo el día.',
            'CIERRE. Rodar los hombros diez veces hacia atrás y respirar profundo tres veces.'
        ],
        emoji: '🎾', type: 'indoor', intensity: 'baja', benefitType: ['Físico', 'Psicológico'], specificBenefits: ['Libera contracturas y puntos gatillo', 'Alivia dolor de espalda alta y cuello', 'Contrarresta la postura frente a la computadora', 'Mejora movilidad de hombros', 'Activa la circulación', 'Herramienta de autocuidado repetible en casa'], description: 'Sesión guiada de liberación miofascial con pelota de tenis, recorriendo en orden las siete zonas donde más se acumula la tensión de una jornada de escritorio: planta del pie, pantorrilla, glúteo, espalda alta, trapecio, pectoral y antebrazo. La regla técnica es presión sostenida, no fricción rápida: al encontrar un punto sensible se mantiene la presión entre 20 y 30 segundos respirando, hasta que la molestia cede. Nunca se rueda directamente sobre la columna vertebral ni sobre articulaciones, siempre sobre el músculo a un costado. El valor real de la actividad es que es la única del programa que el participante puede repetir solo, en su casa o en su lugar de trabajo, sin instructor y sin equipo: por eso las pelotas se reservan exclusivamente para este uso y no se mezclan con juegos.'
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
    },

    // ==========================================
    // NUEVAS OTOÑO 2026 (material del inventario real)
    // ==========================================
    {
        activityId: 'FG-15',
        categoria: 'Físicos/Grupal',
        name: 'Copa Pausas Activas',
        objetivo: 'Pico de participación del periodo con torneo entre áreas.',
        duration: 20,
        materials: 'Spaguetis de natación, las 2 porterías portátiles, el set de bádminton y un pizarrón para el marcador.',
        instrucciones: [
            'Tres retos simultáneos, equipos por área que rotan cada 5 minutos.',
            'Reto 1 — Relevo de spagueti: llevarlo en equilibrio sobre la palma extendida, ida y vuelta, y entregarlo al siguiente sin que caiga.',
            'Reto 2 — Túnel de porterías: pasar el equipo completo por debajo de las dos porterías tomados de la mano, sin soltarse. Si se sueltan, reinician.',
            'Reto 3 — Duelo de gallito: con las dos raquetas de bádminton, cuántos toques seguidos sostiene la pareja sin que caiga.',
            'El marcador de cada área se lleva en el pizarrón portátil, a la vista de todos.'
        ],
        emoji: '🏆', type: 'outdoor', intensity: 'moderada', benefitType: ['Físico', 'Social'], specificBenefits: ['Cardio', 'Coordinación', 'Identidad de equipo', 'Competencia sana'], description: 'El evento grande del periodo: torneo por estaciones entre áreas que pone a trabajar a la vez los spaguetis, las porterías y el set de bádminton. Está pensado como pico de participación más que de intensidad, porque lo que sostiene la asistencia es el ambiente de competencia y el marcador público. Los tres retos exigen habilidades distintas (equilibrio, coordinación de grupo y precisión) para que ningún área gane solo por condición física, y ninguno requiere pelotas: las del inventario están reservadas para el automasaje.'
    },
    {
        activityId: 'JM-23',
        categoria: 'Mesa',
        name: 'Stacko Activo',
        objetivo: 'Juego de mesa con micropausas de movimiento.',
        duration: 15,
        materials: 'UNO Stacko (45 bloques).',
        instrucciones: [
            'Torre armada, se juega por turnos como el Stacko normal.',
            'El color del bloque retirado manda un micro-ejercicio de 10 segundos para todos.',
            'Rojo sentadillas, azul elevación de talones, verde estiramiento de cuello, amarillo círculos de hombro.',
            'Si la torre cae, el grupo entero hace 20 segundos de marcha en el lugar y se rearma.'
        ],
        emoji: '🧱', type: 'indoor', intensity: 'baja', benefitType: ['Físico', 'Social', 'Psicológico'], specificBenefits: ['Pulso y precisión', 'Movimiento intercalado', 'Diversión'], description: 'El UNO Stacko del inventario nunca se había programado. Esta versión le añade una capa de movimiento: cada bloque retirado dispara un micro-ejercicio breve para todo el grupo, no solo para quien juega. Así un juego de mesa sedentario reparte movimiento entre los que miran, que suelen ser mayoría, y funciona como actividad de descarga en las semanas de baja intensidad.'
    }
,
    // ==========================================
    // SECCIÓN AM: AUTOMASAJE CON SET 6 EN 1 (8)
    // 8 sets disponibles. Cada set: rodillo de espuma,
    // palo de masaje, bola de pinchos, bola de fascia,
    // cinturón elástico y bolsa de traslado.
    // ==========================================
    {
        activityId: 'AM-01',
        categoria: 'Relax',
        name: 'Circuito de Automasaje — 5 Estaciones',
        objetivo: 'Descargar espalda, piernas, hombros y pies en formato circuito rotatorio.',
        duration: 15,
        materials: '8 sets 6 en 1 repartidos por implemento: 8 rodillos, 8 palos, 8 bolas de pinchos, 8 bolas de fascia, 8 cinturones. Cronómetro y bocina.',
        instrucciones: [
            'Montaje: separa los 8 sets por implemento y arma 5 estaciones. Cada estación atiende hasta 8 personas a la vez (hasta 40 en total).',
            'E1 Rodillo — espalda alta y dorsal: rodar de omóplatos a costillas bajas, 8 pasadas lentas. NUNCA sobre la zona lumbar ni el cuello.',
            'E2 Palo de masaje — cuádriceps y pantorrilla: presión de rodilla hacia cadera y de tobillo hacia rodilla, 6 pasadas por pierna.',
            'E3 Bola de fascia — trapecio contra la pared: apoya la bola entre la pared y el hombro, busca el punto tenso y sostén 30 s respirando.',
            'E4 Bola de pinchos — planta del pie y antebrazo: rueda descalzo o con calcetín 45 s por pie; luego antebrazo sobre la mesa 30 s por brazo.',
            'E5 Cinturón elástico — estiramiento profundo: isquiotibiales tumbado y apertura de hombro, 30 s por posición sin rebotes.',
            'Rotación: 2 min por estación + 30 s para cambiar. Suena la bocina y todos avanzan a la derecha.',
            'Cierre: 1 min de respiración de pie y recoger cada implemento en su bolsa.'
        ],
        emoji: '🔄', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Libera tensión miofascial', 'Mejora circulación', 'Descarga postural', 'Rango de movimiento'],
        description: 'La actividad principal de los 8 sets nuevos. En lugar de dar un set completo a cada persona, se separan por implemento y se arman 5 estaciones de 8 lugares, con lo que el circuito atiende hasta 40 participantes a la vez. Cubre el segmento de automasaje, que hasta ahora era el más vacío del programa. Reglas de seguridad no negociables: nunca rodar sobre columna lumbar, cuello ni articulaciones; no pasar de 60 a 90 segundos por zona; y si algo duele de forma aguda, se suspende y se pasa a la siguiente estación.'
    },
    {
        activityId: 'AM-02',
        categoria: 'Relax',
        name: 'Set Completo por Equipo',
        objetivo: 'Recorrer los cinco implementos en grupos pequeños, con un set por equipo.',
        duration: 12,
        materials: '8 sets 6 en 1 completos, uno por equipo. Cronómetro.',
        instrucciones: [
            'Forma hasta 8 equipos de 2 o 3 personas. Cada equipo recibe un set completo en su bolsa.',
            'Secuencia guiada de 90 s por implemento, todos al mismo tiempo: rodillo, palo, bola de fascia, bola de pinchos y cinturón.',
            'Dentro del equipo se turnan: mientras uno trabaja, el compañero cuida la técnica y cuenta el tiempo.',
            'Cierre: cada equipo guarda su set completo en la bolsa y verifica que estén las cinco piezas.'
        ],
        emoji: '🎒', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico', 'Social'],
        specificBenefits: ['Libera tensión miofascial', 'Autocuidado guiado', 'Trabajo en parejas'],
        description: 'Variante del circuito para espacios chicos o grupos de hasta 24 personas. Al mantener el set íntegro por equipo se pierde capacidad de atención simultánea, pero se gana en cuidado de la técnica: siempre hay un compañero observando. Es también el formato que mejor enseña a usar el set, porque cada persona toca los cinco implementos en una sola sesión. Sirve como sesión de estreno antes de correr AM-01.'
    },
    {
        activityId: 'AM-03',
        categoria: 'Relax',
        name: 'Rodillo: Descarga de Espalda',
        objetivo: 'Aliviar la tensión de espalda alta acumulada por la postura de pantalla.',
        duration: 6,
        materials: 'Rodillo de espuma (uno por persona, hasta 8). Tapete opcional.',
        instrucciones: [
            'Rodillo perpendicular al cuerpo, apoyado a la altura de los omóplatos, cadera en el piso o suspendida según tolerancia.',
            '8 pasadas lentas de omóplatos a costillas bajas, exhalando en cada bajada.',
            'Detenerse 20 s en el punto más tenso, sin aguantar la respiración.',
            'Apertura torácica: rodillo a lo largo de la columna, brazos abiertos en cruz, 45 s respirando.',
            'REGLA: el rodillo nunca pasa por la zona lumbar ni por el cuello.'
        ],
        emoji: '🧻', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Alivia espalda alta', 'Mejora circulación', 'Apertura torácica'],
        description: 'Pausa corta centrada en el rodillo de espuma, para las semanas en que no hay tiempo del circuito completo. Está dirigida a la espalda alta, que es donde se concentra la queja del personal que pasa la jornada frente al monitor. La restricción de no rodar la zona lumbar es importante: sin el soporte de las costillas, la presión del rodillo ahí puede forzar la columna en lugar de descargarla.'
    },
    {
        activityId: 'AM-04',
        categoria: 'Relax',
        name: 'Palo de Masaje: Piernas Cansadas',
        objetivo: 'Descargar cuádriceps y pantorrillas en personal que pasa la jornada de pie.',
        duration: 6,
        materials: 'Palo de masaje o palo de yoga (uno por persona, hasta 8). Silla.',
        instrucciones: [
            'Sentado en la silla, palo sobre el cuádriceps: presión firme de rodilla hacia cadera, 6 pasadas por pierna.',
            'Pierna cruzada sobre la rodilla contraria, palo sobre la pantorrilla: 6 pasadas de tobillo hacia rodilla.',
            'Tibial anterior: 4 pasadas cortas a un costado del hueso de la espinilla, nunca sobre el hueso.',
            'La presión la controla cada quien con sus manos: debe sentirse molesta pero tolerable, nunca punzante.',
            'Cierre de pie: 30 s de elevación de talones para reactivar el retorno venoso.'
        ],
        emoji: '🦵', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Descarga piernas', 'Mejora retorno venoso', 'Alivia pantorrilla'],
        description: 'Pensada para intendencia, vigilancia y personal de mostrador, que pasan la jornada de pie y casi nunca son el público de una pausa activa de escritorio. El palo permite graduar la presión con las propias manos, lo que la hace más segura que el rodillo para quien nunca ha hecho automasaje. Debe evitarse por completo en personas con várices marcadas, trombosis o problemas de circulación diagnosticados: en esos casos la persona hace solo la elevación de talones del cierre.'
    },
    {
        activityId: 'AM-05',
        categoria: 'Relax',
        name: 'Bola de Fascia: Cuello y Hombro',
        objetivo: 'Liberar los puntos de tensión del trapecio y el hombro de pantalla.',
        duration: 5,
        materials: 'Bola de fascia (una por persona, hasta 8). Pared libre.',
        instrucciones: [
            'De pie, bola entre la pared y el trapecio, a un costado de la columna. Nunca sobre la columna misma.',
            'Buscar el punto tenso moviéndose milímetros; al encontrarlo, sostener 30 s respirando lento.',
            'Con la bola sostenida, subir y bajar el brazo despacio 5 veces para que el músculo se deslice bajo la presión.',
            'Repetir del otro lado.',
            'Cierre: 5 círculos de hombro hacia atrás, amplios y lentos.'
        ],
        emoji: '⚫', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Alivia trapecio', 'Reduce tensión cervical', 'Movilidad de hombro'],
        description: 'La más directa contra la queja número uno del personal administrativo: el dolor de cuello y hombro. Solo necesita una pared, así que se puede aplicar en cualquier pasillo sin mover mobiliario. El movimiento del brazo bajo la presión sostenida es la parte que la hace distinta de un masaje pasivo, porque suma deslizamiento del tejido al efecto de la presión. Si aparece hormigueo o adormecimiento del brazo, se suspende de inmediato.'
    },
    {
        activityId: 'AM-06',
        categoria: 'Relax',
        name: 'Bola de Pinchos: Pies y Manos',
        objetivo: 'Reactivar la planta del pie y descargar la mano y el antebrazo de teclado.',
        duration: 5,
        materials: 'Bola de pinchos (una por persona, hasta 8). Silla.',
        instrucciones: [
            'Sentado, pie descalzo o con calcetín sobre la bola: rodar del talón a los dedos, 45 s por pie.',
            'Detenerse 15 s en el arco del pie, que es donde suele estar el punto más sensible.',
            'Antebrazo sobre la mesa, bola debajo: rodar de muñeca a codo por la cara interna, 30 s por brazo.',
            'Palma de la mano sobre la bola contra la mesa: presión y círculos, 20 s por mano.',
            'Cierre: abrir y cerrar las manos 10 veces, estirando bien los dedos.'
        ],
        emoji: '🦶', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Alivia planta del pie', 'Descarga antebrazo', 'Previene molestia de teclado'],
        description: 'La única del set que se puede hacer sin levantarse de la silla ni cambiarse de ropa, lo que la vuelve la mejor candidata para oficinas donde cuesta trabajo que la gente se ponga de pie. Atiende dos zonas que ninguna otra actividad del catálogo toca: la planta del pie y el antebrazo de quien pasa el día en teclado y mouse. Los pinchos hacen la presión más intensa de lo que la gente espera, así que conviene avisar que se empieza con poco peso encima.'
    },
    {
        activityId: 'AM-07',
        categoria: 'Relax',
        name: 'Cinturón Elástico: Estiramiento Profundo',
        objetivo: 'Ganar rango de movimiento después del masaje, cuando el tejido está más receptivo.',
        duration: 7,
        materials: 'Cinturón elástico del set (uno por persona, hasta 8). Tapete o piso limpio.',
        instrucciones: [
            'Isquiotibiales: tumbado boca arriba, cinturón en la planta del pie, pierna estirada hacia el techo. 30 s por pierna.',
            'Cadera: desde la misma posición, llevar la pierna hacia afuera sujetando el cinturón. 30 s por lado.',
            'Hombro: cinturón sujeto con ambas manos por delante, subir los brazos estirados por encima de la cabeza y llevarlos atrás lo que permita el hombro. 5 repeticiones lentas.',
            'Pectoral: cinturón detrás de la espalda, manos separadas, abrir el pecho 30 s.',
            'REGLA: estiramiento sostenido y sin rebotes. Debe jalar, no doler.'
        ],
        emoji: '➰', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico'],
        specificBenefits: ['Rango de movimiento', 'Flexibilidad', 'Apertura de hombro y pecho'],
        description: 'Va después del masaje, no antes: el tejido responde mejor al estiramiento cuando ya se trabajó con rodillo o bola. El cinturón permite llegar a posiciones que sin apoyo requieren flexibilidad que el personal administrativo no suele tener, así que baja la barrera de entrada de un estiramiento profundo. Es también la actividad de cierre natural del circuito AM-01.'
    },
    {
        activityId: 'AM-08',
        categoria: 'Relax',
        name: 'Reset de Escritorio (5 min)',
        objetivo: 'Micropausa de automasaje sin moverse del lugar de trabajo.',
        duration: 5,
        materials: 'Una bola de fascia o de pinchos por persona. Nada más.',
        instrucciones: [
            'Todos se quedan en su lugar. Se reparte una bola por persona.',
            '1 min — planta del pie: rodar la bola bajo el pie, alternando.',
            '1 min — antebrazo sobre el escritorio con la bola debajo.',
            '1 min — bola entre el respaldo de la silla y el omóplato, buscando el punto tenso.',
            '1 min — palma y dedos sobre la bola contra el escritorio.',
            '1 min — respiración: 4 s inhalar, 6 s exhalar, hombros sueltos.'
        ],
        emoji: '⏱️', type: 'indoor', intensity: 'baja',
        benefitType: ['Físico', 'Psicológico'],
        specificBenefits: ['Micropausa', 'Alivia tensión localizada', 'Baja activación mental'],
        description: 'La versión mínima del automasaje, para departamentos en periodo de cierre o auditoría donde no se puede sacar a la gente de su escritorio. Cabe en cinco minutos, no requiere espacio ni cambio de ropa y usa una sola pieza del set, así que con los 8 sets se puede atender a 16 personas repartiendo las dos bolas de cada uno. Es la carta que conviene tener a la mano cuando un área cancela la pausa por carga de trabajo.'
    },

    // ==========================================
    // SECCIÓN FG (ampliación): CORNHOLE Y VÓLEY GIGANTE (5)
    // ==========================================
    {
        activityId: 'FG-16',
        categoria: 'Físicos/Grupal',
        name: 'Cornhole Clásico',
        objetivo: 'Precisión de lanzamiento y competencia tranquila entre parejas.',
        duration: 10,
        materials: 'Tableros de cornhole y costales. Gis o cinta para marcar la línea de tiro.',
        instrucciones: [
            'Dos tableros enfrentados a la distancia que permita el espacio; si es reducido, acortar y avisar que la distancia es la misma para todos.',
            'Se juega en parejas, cada jugador lanza sus 4 costales por turno.',
            'Puntuación: 3 puntos si el costal entra al hoyo, 1 punto si se queda sobre el tablero, 0 si cae fuera.',
            'Gana la primera pareja en llegar a 21 puntos, o la que vaya arriba cuando se acabe el tiempo.',
            'Rotar parejas cada ronda para que la gente juegue con compañeros de otras áreas.'
        ],
        emoji: '🎯', type: 'outdoor', intensity: 'baja',
        benefitType: ['Físico', 'Social'],
        specificBenefits: ['Precisión', 'Coordinación óculo-manual', 'Convivencia entre áreas'],
        description: 'El material nuevo que mejor funcionó en la práctica. Su ventaja es la barrera de entrada casi nula: no exige condición física, ni ropa deportiva, ni saber jugar nada previo, así que entra gente que normalmente no participa. Al ser de baja intensidad, sirve para semanas de descarga o para grupos con personal de mayor edad, y la rotación de parejas es lo que convierte un juego de puntería en una actividad de convivencia entre departamentos.'
    },
    {
        activityId: 'FG-17',
        categoria: 'Físicos/Grupal',
        name: 'Torneo Relámpago de Costales',
        objetivo: 'Pico de participación con competencia entre áreas y marcador público.',
        duration: 15,
        materials: 'Tableros de cornhole y costales. Pizarrón portátil para el marcador.',
        instrucciones: [
            'Cada área inscribe una pareja. Se arma un cuadro de eliminatorias cortas.',
            'Rondas rápidas: primera pareja en llegar a 11 puntos pasa a la siguiente ronda.',
            'El marcador va en el pizarrón, a la vista de todos, con el nombre del área y no el de las personas.',
            'Quien pierde no se va: se queda como público del siguiente duelo y cuenta los puntos.',
            'Cierre: reconocimiento al área ganadora, sin castigo ni mención al último lugar.'
        ],
        emoji: '🏆', type: 'outdoor', intensity: 'baja',
        benefitType: ['Físico', 'Social'],
        specificBenefits: ['Identidad de área', 'Competencia sana', 'Alta participación'],
        description: 'La versión de evento del cornhole, para usarse como pico del periodo. Está armada según lo que muestra la literatura de gamificación laboral: la competencia entre equipos combinada con cooperación dentro del equipo mueve más participación que competir de forma individual. Que el marcador lleve el nombre del área y no el de la persona es deliberado, igual que no mencionar al último lugar: el objetivo es que el área siguiente quiera inscribirse, no que alguien quede exhibido.'
    },
    {
        activityId: 'FG-18',
        categoria: 'Físicos/Grupal',
        name: 'Costales a Ciegas',
        objetivo: 'Comunicación clara bajo presión, con marcador colectivo y sin eliminación.',
        duration: 10,
        materials: 'Tableros de cornhole y costales. Paliacates o antifaces (opcional: basta con cerrar los ojos).',
        instrucciones: [
            'Se juega en parejas: uno lanza con los ojos cerrados, el otro solo puede guiarlo con la voz.',
            'El guía no puede tocar al lanzador ni acomodarle el brazo. Solo palabras.',
            'Cada pareja tiene 4 lanzamientos y luego se invierten los papeles.',
            'El marcador es del grupo entero, no de cada pareja: se suman todos los puntos y se compara contra el resultado de la sesión anterior.',
            'Cierre en círculo: qué instrucción sirvió y cuál confundió.'
        ],
        emoji: '🤝', type: 'outdoor', intensity: 'baja',
        benefitType: ['Social', 'Psicológico'],
        specificBenefits: ['Comunicación verbal', 'Confianza', 'Cohesión de equipo'],
        description: 'Convierte el mismo material del cornhole en un juego cooperativo puro: nadie es eliminado y el marcador es del grupo completo contra su propia marca anterior, no de unos contra otros. Sirve para áreas con fricción interna o para integrar personal nuevo, porque obliga a que dos personas se pongan de acuerdo en un lenguaje común en menos de un minuto. El cierre en círculo es la parte que la vuelve útil como actividad de equipo y no solo como juego.'
    },
    {
        activityId: 'FG-19',
        categoria: 'Físicos/Grupal',
        name: 'Vóley Gigante en Círculo',
        objetivo: 'Sostener la pelota en el aire entre todos, con marcador colectivo.',
        duration: 10,
        materials: 'Pelota gigante de voleibol de playa. Espacio abierto sin techo bajo.',
        instrucciones: [
            'Todo el grupo en círculo amplio, brazos sueltos.',
            'Objetivo único: que la pelota no toque el piso. Se cuenta en voz alta cada toque del grupo.',
            'Regla que lo vuelve cooperativo: nadie puede dar dos toques seguidos, así que todos terminan participando.',
            'Si cae, no pasa nada: se reinicia la cuenta y se intenta superar la marca.',
            'Progresión si sale fácil: agregar que hay que decir el nombre de a quién se le pasa.'
        ],
        emoji: '🏐', type: 'outdoor', intensity: 'moderada',
        benefitType: ['Físico', 'Social'],
        specificBenefits: ['Coordinación', 'Cohesión de grupo', 'Activación de hombro'],
        description: 'Aprovecha el tamaño de la pelota de playa, que baja lento y perdona los errores de cálculo, para que participe gente sin nada de experiencia en voleibol. La regla de no dar dos toques seguidos es lo que impide que dos o tres personas hábiles acaparen el juego, que es el modo más común en que estas dinámicas dejan fuera a la mayoría. El marcador colectivo contra la propia marca elimina la comparación entre personas.'
    },
    {
        activityId: 'FG-20',
        categoria: 'Físicos/Grupal',
        name: 'Vóley Playa Adaptado',
        objetivo: 'Activación cardiovascular con el gesto del voleibol en espacio reducido.',
        duration: 12,
        materials: 'Pelota gigante de voleibol de playa. Cuerda, cinta o red improvisada.',
        instrucciones: [
            'Red improvisada a la altura que permita el espacio; dos equipos de 4 a 6 personas por lado.',
            'Se permite un bote en el piso antes de devolver, lo que alarga las jugadas y baja la frustración.',
            'Máximo 3 toques por lado, y no se puede rematar hacia abajo: solo pases y envíos altos.',
            'Marcador corto: sets a 11 puntos para que alcance a jugarse más de uno.',
            'Rotación obligatoria de posiciones en cada punto ganado.'
        ],
        emoji: '🌴', type: 'outdoor', intensity: 'moderada',
        benefitType: ['Físico', 'Social'],
        specificBenefits: ['Cardio', 'Coordinación', 'Trabajo en equipo'],
        description: 'La versión pre-deportiva de la pelota gigante: conserva el gesto y la lógica del voleibol pero con reglas adaptadas que evitan que se decida por la habilidad de una o dos personas. El bote permitido y la prohibición de rematar son las dos adaptaciones que más sostienen la participación, porque alargan los puntos y quitan el miedo a recibir un golpe fuerte. Requiere calzado con el que se pueda desplazar, así que conviene anunciarla con anticipación.'
    },

    // ==========================================
    // SECCIÓN VD (ampliación): JUEGOS DE NETFLIX (5)
    // ==========================================
    {
        activityId: 'VD-05',
        categoria: 'Digital',
        name: 'Boggle Party',
        objetivo: 'Agilidad verbal y atención en formato de juego rápido por equipos.',
        duration: 12,
        materials: 'Pantalla o proyector con Netflix. Celular de cada participante como control.',
        instrucciones: [
            'Se proyecta el tablero en la pantalla grande; cada quien usa su celular para participar.',
            'Rondas cortas: formar la mayor cantidad de palabras posibles con las letras en pantalla.',
            'Jugar por equipos de área y sumar los puntos individuales del equipo.',
            'Micropausa entre rondas: 20 s de círculos de hombro y estiramiento de cuello, obligatoria.',
            'Cierre con la palabra más larga de la sesión anotada en el pizarrón.'
        ],
        emoji: '🔤', type: 'indoor', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Agilidad mental', 'Atención', 'Convivencia'],
        description: 'Entra al segmento de juegos virtuales con una ventaja práctica sobre las consolas: no hace falta más hardware que la pantalla y los celulares que la gente ya trae. Al no exigir destreza motriz, no deja fuera a quien no juega videojuegos, que es el riesgo habitual de este segmento. La micropausa de movimiento entre rondas está puesta a propósito, porque de otro modo la actividad sería completamente sedentaria y dejaría de ser una pausa activa.'
    },
    {
        activityId: 'VD-06',
        categoria: 'Digital',
        name: 'Pictionary Digital',
        objetivo: 'Comunicación creativa y desinhibición en grupo.',
        duration: 12,
        materials: 'Pantalla o proyector con Netflix. Celular de cada participante como control.',
        instrucciones: [
            'Equipos mixtos, mezclando áreas para que no se junten siempre los mismos.',
            'Por turnos, una persona dibuja en su celular y su equipo adivina contra reloj.',
            'Quien adivina primero suma para su equipo; el dibujante rota en cada ronda para que todos pasen.',
            'Regla de la casa: quien no quiera dibujar puede adivinar, la participación nunca es forzada.',
            'Micropausa de 20 s de pie entre rondas.'
        ],
        emoji: '🎨', type: 'indoor', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Creatividad', 'Desinhibición', 'Vínculo entre áreas'],
        description: 'El más social de los juegos digitales del catálogo, porque el que dibuja queda expuesto de forma amable y eso rompe el hielo entre departamentos que no se tratan. La regla de que nadie está obligado a dibujar no es un detalle menor: la literatura de diversión en el trabajo advierte que la actividad lúdica impuesta puede aumentar el desgaste en quien no la disfruta, así que conviene dejar siempre una forma digna de participar sin pasar al frente.'
    },
    {
        activityId: 'VD-07',
        categoria: 'Digital',
        name: 'Noche de Juegos',
        objetivo: 'Sesión de variedad para cerrar periodo o celebrar una meta del área.',
        duration: 20,
        materials: 'Pantalla o proyector con Netflix. Celulares como control. Sillas en semicírculo.',
        instrucciones: [
            'Formato de variedad: tres minijuegos cortos elegidos por votación del grupo al inicio.',
            'Equipos fijos durante toda la sesión, con nombre elegido por ellos.',
            'Entre juego y juego, 1 min de movimiento de pie dirigido por un integrante distinto cada vez.',
            'Marcador acumulado en el pizarrón.',
            'Cierre: reconocimiento al equipo ganador y foto de grupo.'
        ],
        emoji: '🌙', type: 'indoor', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Convivencia', 'Cierre de periodo', 'Identidad de equipo'],
        description: 'Sesión larga pensada como evento y no como pausa de rutina: cierre de periodo, celebración de una meta o última sesión antes de vacaciones. Los minutos de movimiento entre juegos son lo que la mantiene dentro del programa de pausas activas y no la convierten en una simple reunión social. Al ser de 20 minutos requiere permiso previo del jefe del área, así que conviene agendarla con anticipación y no improvisarla.'
    },
    {
        activityId: 'VD-08',
        categoria: 'Digital',
        name: 'Overcooked por Equipos',
        objetivo: 'Coordinación y comunicación bajo presión de tiempo, sin ganador individual.',
        duration: 15,
        materials: 'Pantalla o proyector con Netflix y controles disponibles. Sillas.',
        instrucciones: [
            'Grupos de 2 a 4 personas por partida; el resto observa y puede dar indicaciones en voz alta.',
            'El juego es cooperativo: el equipo entero gana o pierde junto, no hay marcador individual.',
            'Se juegan 2 o 3 niveles cortos y se rota el grupo que tiene los controles.',
            'Regla de la casa: se puede gritar instrucciones, no reclamos. Si alguien se frustra, se pausa.',
            'Cierre en círculo: qué falló en la organización del equipo y cómo se arregló.'
        ],
        emoji: '🍳', type: 'indoor', intensity: 'baja',
        benefitType: ['Psicológico', 'Social'],
        specificBenefits: ['Coordinación de equipo', 'Comunicación bajo presión', 'Tolerancia al error'],
        description: 'Es el único juego digital del catálogo que es cooperativo puro, por eso está clasificado en juegos cooperativos y no en virtuales: el equipo gana o pierde junto y no existe marcador individual. Lo interesante para bienestar laboral es que reproduce en pequeño el problema real de un área saturada, coordinarse cuando sobran tareas y falta tiempo, y el cierre en círculo permite hablar de eso sin señalar a nadie. Conviene vigilar el tono, porque la presión del juego puede sacar reclamos reales.'
    },
    {
        activityId: 'VD-09',
        categoria: 'Digital',
        name: 'Tetris Relámpago',
        objetivo: 'Enfoque y desconexión mental breve de la tarea laboral.',
        duration: 8,
        materials: 'Pantalla o proyector con Netflix y controles disponibles.',
        instrucciones: [
            'Partidas cortas de 2 min por persona, con el grupo observando.',
            'Se lleva la marca más alta de la sesión en el pizarrón, con el nombre del área.',
            'Quien no quiera pasar al frente puede jugar desde su lugar o solo observar.',
            'Al terminar cada partida, quien jugó dirige 20 s de estiramiento de manos y cuello.',
            'Cierre: 1 min de respiración lenta antes de volver al trabajo.'
        ],
        emoji: '🟦', type: 'indoor', intensity: 'baja',
        benefitType: ['Psicológico'],
        specificBenefits: ['Desconexión mental', 'Enfoque', 'Micropausa cognitiva'],
        description: 'La actividad más corta del segmento digital, útil como micropausa cognitiva en días de carga alta. Su función principal no es mover el cuerpo sino cortar la rumiación de la tarea pendiente, que es el mecanismo por el que una pausa breve recupera vigor aunque no haya esfuerzo físico. El estiramiento de manos y cuello que dirige quien acaba de jugar es lo que le agrega el componente corporal y evita que sea puro tiempo de pantalla.'
    }
];
