/**
 * Walking Executive Report Generator
 * Generates high-level PDF reports based on walking activity JSON data.
 * Designed for "IBERO ACTÍVATE" Premium Aesthetics.
 */

window.generateExecutiveWalkingReport = async function (reportData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const meta = reportData.metadatos;
    const stats = reportData.estadisticas_individuales_promedio;
    const totals = reportData.totales_grupales;
    const phases = reportData.desglose_tramos_intensidad;

    // --- COLORS & STYLES ---
    const primaryColor = [16, 185, 129]; // Emerald 500
    const secondaryColor = [31, 41, 55]; // Gray 800
    const accentColor = [59, 130, 246]; // Blue 500
    const lightBg = [249, 250, 251]; // Gray 50

    // --- PAGE 1: EXECUTIVE SUMMARY ---

    // Header Background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("REPORTE EJECUTIVO DE CAMINATA", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`IBERO ACTÍVATE - ${meta.tipo_actividad}`, 105, 30, { align: "center" });

    // Meta Info Row
    let yPos = 55;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", 20, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(meta.fecha, 40, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("DURACIÓN:", 80, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${meta.duracion_total_minutos} min`, 110, yPos);

    doc.setFont("helvetica", "bold");
    doc.text("GRUPO:", 150, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${meta.tamano_grupo} integrantes`, 170, yPos);

    yPos += 15;

    // --- KEY METRICS TILES ---
    const drawTile = (x, y, w, h, title, value, unit, iconColor) => {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.roundedRect(x, y, w, h, 3, 3, 'F');
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x, y, w, h, 3, 3, 'S');

        doc.setTextColor(107, 114, 128);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), x + w / 2, y + 8, { align: "center" });

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(16);
        doc.text(`${value}`, x + w / 2, y + 20, { align: "center" });

        doc.setFontSize(8);
        doc.setTextColor(iconColor[0], iconColor[1], iconColor[2]);
        doc.text(unit, x + w / 2, y + 25, { align: "center" });
    };

    drawTile(20, yPos, 53, 30, "Distancia Total", totals.distancia_total_km, "Kilómetros", primaryColor);
    drawTile(78, yPos, 53, 30, "Pasos Totales", totals.pasos_totales, "Pasos Agregados", accentColor);
    drawTile(136, yPos, 53, 30, "Calorías Grupo", totals.calorias_totales_kcal, "Kcal Quemadas", [239, 68, 68]);

    yPos += 40;

    // --- SECONDARY METRICS ---
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Promedios Individuales", 20, yPos);
    yPos += 10;

    const avgData = [
        ["Métrica", "Valor Promedio", "Unidad"],
        ["Distancia", stats.distancia_km, "km"],
        ["Pasos", stats.pasos_estimados, "pasos"],
        ["Calorías", stats.calorias_kcal, "kcal"],
        ["Ritmo", stats.ritmo_min_km, "min/km"],
        ["Velocidad", stats.velocidad_media_kmh, "km/h"]
    ];

    doc.autoTable({
        startY: yPos,
        head: [avgData[0]],
        body: avgData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // --- PHASE ANALYSIS ---
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Análisis de Intensidad por Fases", 20, yPos);
    yPos += 10;

    const phaseBody = phases.map(p => [
        p.fase,
        p.rango_horario,
        `${p.distancia_metros} m`,
        p.observacion
    ]);

    doc.autoTable({
        startY: yPos,
        head: [['Fase de Actividad', 'Horario', 'Distancia', 'Observación Técnica']],
        body: phaseBody,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor, textColor: 255 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 70 }
        },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
    });

    // --- FOOTER ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generado por IBERO ACTÍVATE IA - ${new Date().toLocaleString()}`, 105, 285, { align: "center" });
        doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: "right" });
    }

    // Save
    const fileName = `Reporte_Ejecutivo_Caminata_${meta.fecha.replace(/ /g, '_')}.pdf`;
    doc.save(fileName);
    return fileName;
};
