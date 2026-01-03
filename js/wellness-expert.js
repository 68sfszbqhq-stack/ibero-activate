// Experto de IA en Bienestar - Recomendaciones Personalizadas

document.addEventListener('DOMContentLoaded', () => {
    waitForFirebase(initWellnessExpert);
});

function waitForFirebase(callback) {
    if (typeof db !== 'undefined' && db) {
        callback();
    } else {
        console.log('Esperando a Firebase...');
        setTimeout(() => waitForFirebase(callback), 100);
    }
}

function initWellnessExpert() {
    // --- STATE ---
    let currentEmployee = JSON.parse(localStorage.getItem('currentEmployee'));
    let wellnessData = null;

    // --- DOM ELEMENTS ---
    const userNameDisplay = document.getElementById('user-name-display');
    const testsStatus = document.getElementById('tests-status');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading-state');
    const resultsContainer = document.getElementById('results-container');

    // --- INIT ---
    if (!currentEmployee) {
        alert('No hay empleado activo. Regresando al inicio.');
        window.location.href = '../index.html';
        return;
    }

    userNameDisplay.textContent = currentEmployee.name;

    // Load saved API key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    }

    // Load employee wellness data
    loadEmployeeWellnessData();

    // Store recommendations globally for PDF export
    let currentRecommendations = null;

    // --- EVENT LISTENERS ---
    generateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            alert('Por favor ingresa tu API Key de Gemini');
            return;
        }

        if (!wellnessData || wellnessData.totalTests === 0) {
            alert('Necesitas completar al menos un cuestionario de bienestar antes de obtener recomendaciones.');
            return;
        }

        // Save API key
        localStorage.setItem('gemini_api_key', apiKey);

        try {
            loadingState.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            generateBtn.disabled = true;

            console.log('Generando recomendaciones personalizadas con IA...');
            const recommendations = await generatePersonalizedRecommendations(wellnessData, apiKey);

            currentRecommendations = recommendations;
            displayRecommendations(recommendations);

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    // PDF Export Handler
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    exportPdfBtn.addEventListener('click', () => {
        if (!currentRecommendations) {
            alert('No hay recomendaciones para exportar');
            return;
        }
        generatePDF(currentRecommendations, currentEmployee, wellnessData);
    });

    // --- FUNCTIONS ---

    async function loadEmployeeWellnessData() {
        try {
            // Get all health surveys for this employee
            const surveysSnapshot = await db.collection('employees')
                .doc(currentEmployee.id)
                .collection('health_surveys')
                .orderBy('timestamp', 'desc')
                .get();

            // Organize by test type (get most recent of each)
            const testTypes = ['ansiedad', 'burnout', 'depresion', 'estres'];
            const latestTests = {};

            surveysSnapshot.forEach(doc => {
                const data = doc.data();
                const testType = data.type;

                // Only keep the most recent test of each type
                if (testTypes.includes(testType) && !latestTests[testType]) {
                    latestTests[testType] = {
                        type: testType,
                        title: data.testTitle,
                        score: data.score,
                        level: data.level,
                        rawScore: data.rawScore,
                        answers: data.answers,
                        date: data.date,
                        dimensions: data.dimensions
                    };
                }
            });

            wellnessData = {
                totalTests: Object.keys(latestTests).length,
                tests: latestTests
            };

            displayTestsStatus(latestTests);

        } catch (error) {
            console.error('Error loading wellness data:', error);
            testsStatus.innerHTML = '<p class="text-red-600">Error al cargar tus datos de bienestar.</p>';
        }
    }

    function displayTestsStatus(tests) {
        const testTypes = [
            { id: 'ansiedad', name: 'Ansiedad', icon: 'fa-bolt', color: 'orange' },
            { id: 'burnout', name: 'Burnout', icon: 'fa-fire', color: 'red' },
            { id: 'depresion', name: 'Depresión', icon: 'fa-cloud-rain', color: 'blue' },
            { id: 'estres', name: 'Estrés', icon: 'fa-weight-hanging', color: 'purple' }
        ];

        testsStatus.innerHTML = testTypes.map(testType => {
            const testData = tests[testType.id];
            const completed = !!testData;

            if (completed) {
                return `
                    <div class="badge badge-completed">
                        <i class="fa-solid ${testType.icon}"></i>
                        <span>${testType.name}: ${testData.level}</span>
                        <i class="fa-solid fa-check-circle"></i>
                    </div>
                `;
            } else {
                return `
                    <div class="badge badge-pending">
                        <i class="fa-solid ${testType.icon}"></i>
                        <span>${testType.name}: Pendiente</span>
                        <i class="fa-solid fa-clock"></i>
                    </div>
                `;
            }
        }).join('');
    }

    async function generatePersonalizedRecommendations(data, apiKey) {
        // Build context about the employee's wellness state
        const testsInfo = Object.values(data.tests).map(test => {
            let info = `- ${test.title}: Nivel ${test.level} (puntuación: ${test.score})`;

            // Add dimensional info for burnout if available
            if (test.dimensions) {
                info += `\n  * Burnout Personal: ${test.dimensions.personal}%`;
                info += `\n  * Burnout Laboral: ${test.dimensions.work}%`;
                info += `\n  * Burnout con Clientes: ${test.dimensions.client}%`;
            }

            return info;
        }).join('\n');

        const prompt = `Eres un experto en salud ocupacional y bienestar integral. Analiza los siguientes resultados de evaluaciones de bienestar de un empleado y genera recomendaciones PERSONALIZADAS y ESPECÍFICAS.

DATOS DEL EMPLEADO:
${testsInfo}

INSTRUCCIONES:
Genera recomendaciones específicas, prácticas y personalizadas en 4 áreas. Cada recomendación debe:
- Ser concreta y accionable
- Estar basada en los niveles detectados
- Ser empática y motivadora
- Ser BREVE (máximo 2-3 líneas cada una)

Responde EXACTAMENTE en el siguiente formato JSON (sin markdown, solo JSON puro):

{
  "salud_fisica": [
    "Recomendación específica 1 (breve)",
    "Recomendación específica 2 (breve)",
    "Recomendación específica 3 (breve)"
  ],
  "salud_emocional": [
    "Recomendación específica 1 (breve)",
    "Recomendación específica 2 (breve)",
    "Recomendación específica 3 (breve)"
  ],
  "salud_laboral": [
    "Recomendación específica 1 (breve)",
    "Recomendación específica 2 (breve)",
    "Recomendación específica 3 (breve)"
  ],
  "salud_mental": [
    "Recomendación específica 1 (breve)",
    "Recomendación específica 2 (breve)",
    "Recomendación específica 3 (breve)"
  ],
  "insights_generales": [
    "Insight general 1 (breve)",
    "Insight general 2 (breve)"
  ]
}

IMPORTANTE: 
- Si detectas niveles altos de ansiedad/depresión/burnout, prioriza recomendaciones de autocuidado y apoyo profesional
- Si los niveles son buenos, enfócate en mantenimiento y prevención
- Usa un tono profesional pero cálido y cercano
- Las recomendaciones deben ser realistas y aplicables en el contexto laboral mexicano
- MANTÉN TODAS LAS RECOMENDACIONES BREVES para asegurar que el JSON esté completo`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 4096,
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error llamando a Gemini API');
        }

        const result = await response.json();
        const aiText = result.candidates[0].content.parts[0].text;

        console.log('Respuesta completa de Gemini:', aiText); // Debug

        // Parse JSON response (handle both pure JSON and markdown-wrapped JSON)
        let jsonText = aiText;

        // Remove markdown code blocks if present
        if (aiText.includes('```json')) {
            const match = aiText.match(/```json\s*([\s\S]*?)\s*```/);
            if (match) {
                jsonText = match[1];
            }
        } else if (aiText.includes('```')) {
            const match = aiText.match(/```\s*([\s\S]*?)\s*```/);
            if (match) {
                jsonText = match[1];
            }
        }

        // Try to extract JSON object if still not pure JSON
        if (!jsonText.trim().startsWith('{')) {
            const match = jsonText.match(/\{[\s\S]*\}/);
            if (!match) {
                console.error('No se encontró JSON en la respuesta:', aiText);
                throw new Error('La IA no devolvió un formato JSON válido. Por favor intenta de nuevo.');
            }
            jsonText = match[0];
        }

        const parsedData = JSON.parse(jsonText);
        console.log('Datos parseados:', parsedData); // Debug
        return parsedData;
    }

    function displayRecommendations(recommendations) {
        console.log('Mostrando recomendaciones:', recommendations); // Debug

        // Physical health
        document.getElementById('physical-recommendations').innerHTML =
            recommendations.salud_fisica.map(rec => `
                <div class="flex items-start gap-3 bg-green-50 p-3 rounded-lg">
                    <i class="fa-solid fa-check text-green-600 mt-1"></i>
                    <p class="text-sm leading-relaxed">${rec}</p>
                </div>
            `).join('');

        // Emotional health
        document.getElementById('emotional-recommendations').innerHTML =
            recommendations.salud_emocional.map(rec => `
                <div class="flex items-start gap-3 bg-pink-50 p-3 rounded-lg">
                    <i class="fa-solid fa-check text-pink-600 mt-1"></i>
                    <p class="text-sm leading-relaxed">${rec}</p>
                </div>
            `).join('');

        // Occupational health
        document.getElementById('occupational-recommendations').innerHTML =
            recommendations.salud_laboral.map(rec => `
                <div class="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                    <i class="fa-solid fa-check text-blue-600 mt-1"></i>
                    <p class="text-sm leading-relaxed">${rec}</p>
                </div>
            `).join('');

        // Mental health
        document.getElementById('mental-recommendations').innerHTML =
            recommendations.salud_mental.map(rec => `
                <div class="flex items-start gap-3 bg-purple-50 p-3 rounded-lg">
                    <i class="fa-solid fa-check text-purple-600 mt-1"></i>
                    <p class="text-sm leading-relaxed">${rec}</p>
                </div>
            `).join('');

        // General insights
        document.getElementById('general-insights').innerHTML =
            recommendations.insights_generales.map(insight => `
                <div class="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <i class="fa-solid fa-star text-yellow-600 mt-1"></i>
                    <p class="leading-relaxed">${insight}</p>
                </div>
            `).join('');

        // Update date
        document.getElementById('generation-date').textContent =
            new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

        // Show results
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth' });

        // Show PDF export button
        document.getElementById('export-pdf-btn').classList.remove('hidden');
    }

    function generatePDF(recommendations, employee, data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = margin;

        // Helper function to add text with line breaks
        const addWrappedText = (text, x, y, maxWidth) => {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * 7);
        };

        // Helper to check if we need a new page
        const checkNewPage = (requiredSpace) => {
            if (yPos + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        };

        // Header with gradient effect (simulated with rects)
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte de Bienestar Personal', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Generado con Inteligencia Artificial', pageWidth / 2, 30, { align: 'center' });

        yPos = 50;

        // Employee Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Empleado: ${employee.name}`, margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const date = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Fecha: ${date}`, margin, yPos);
        yPos += 15;

        // Tests Summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Evaluaciones Completadas:', margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.values(data.tests).forEach(test => {
            doc.text(`• ${test.title}: Nivel ${test.level}`, margin + 5, yPos);
            yPos += 6;
        });
        yPos += 10;

        // Recommendations sections
        const sections = [
            { key: 'salud_fisica', title: 'Salud Física', color: [34, 197, 94] },
            { key: 'salud_emocional', title: 'Salud Emocional', color: [236, 72, 153] },
            { key: 'salud_laboral', title: 'Salud Laboral', color: [59, 130, 246] },
            { key: 'salud_mental', title: 'Salud Mental', color: [168, 85, 247] }
        ];

        sections.forEach(section => {
            checkNewPage(40);

            // Section header with colored bar
            doc.setFillColor(...section.color);
            doc.rect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, 12, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(section.title, margin, yPos + 3);
            yPos += 15;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            recommendations[section.key].forEach((rec, index) => {
                checkNewPage(20);
                const bulletText = `${index + 1}. ${rec}`;
                yPos = addWrappedText(bulletText, margin + 5, yPos, pageWidth - (margin * 2) - 10);
                yPos += 3;
            });

            yPos += 10;
        });

        // General Insights
        checkNewPage(40);
        doc.setFillColor(234, 179, 8);
        doc.rect(margin - 5, yPos - 5, pageWidth - (margin * 2) + 10, 12, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Insights Generales', margin, yPos + 3);
        yPos += 15;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        recommendations.insights_generales.forEach((insight, index) => {
            checkNewPage(20);
            const bulletText = `⭐ ${insight}`;
            yPos = addWrappedText(bulletText, margin + 5, yPos, pageWidth - (margin * 2) - 10);
            yPos += 3;
        });

        // Footer on last page
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text('IBERO ACTÍVATE - Centro de Bienestar', pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Save PDF with proper extension
        const employeeName = employee.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Reporte_Bienestar_${employeeName}_${dateStr}.pdf`;

        // Ensure proper download
        doc.save(fileName);
    }
}
