
// logic-routes-pdf.js
// Generación de PDF con Rutas y Horarios

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-download-routes');
    if (btn) {
        btn.addEventListener('click', generateRoutesSimplePDF);
    }
});

function generateRoutesSimplePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Config
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPos = 20;

    // --- HELPER: Centered Text ---
    const centerText = (text, y) => {
        const textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    // --- HEADER ---
    doc.setFillColor(220, 38, 38); // Rojo Ibero (Aprox)
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    centerText("IBERO ACTÍVATE", 18);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    centerText("RUTAS Y HORARIOS - PRIMAVERA 2026", 28);

    doc.setTextColor(0, 0, 0); // Reset color
    yPos = 55;

    // --- CONTENT DEFINITION ---
    // Datos actualizados y MUY ESPECÍFICOS (Sin abreviaturas)
    const allRoutes = [
        {
            day: 'Lunes y Miércoles',
            color: [59, 130, 246], // Azul
            areas: [
                { time: '10:00 - 10:20', name: 'PLANTA FÍSICA' },
                { time: '10:20 - 10:40', name: 'ADMISIONES' },
                { time: '10:40 - 11:00', name: 'DIRECCIÓN DE PERSONAL' },
                { time: '11:00 - 11:20', name: 'TESORERÍA' },
                { time: '11:20 - 11:40', name: 'DIRECCIÓN DE SERVICIOS GENERALES (COMPRAS) Y FORMACIÓN DE PROFESORES' },
                { time: '11:40 - 12:00', name: 'EDUCACIÓN CONTINUA' },
                { time: '12:00 - 12:20', name: 'EGRESADOS' },
                { time: '12:20 - 12:40', name: 'DEPARTAMENTO CIENCIAS DE LA SALUD, HUMANIDADES, INSTITUTO DE INVESTIGACIONES EN MEDIO AMBIENTE' }
            ]
        },
        {
            day: 'Martes y Jueves',
            color: [16, 185, 129], // Verde
            areas: [
                { time: '10:00 - 10:20', name: 'SERVICIOS ESCOLARES' },
                { time: '10:20 - 11:00', name: 'DIRECCIONES GENERALES, HUMANIDADES, DEPARTAMENTO DE CIENCIAS SOCIALES' },
                { time: '11:00 - 11:20', name: 'IDIT' },
                { time: '11:20 - 11:40', name: 'PROTECCIÓN UNIVERSITARIA' },
                { time: '11:40 - 12:00', name: 'AIDEL, SERVICIO SOCIAL, REFLEXIÓN UNIVERSITARIA, DADA' },
                { time: '12:00 - 12:30', name: 'PLANEACIÓN Y EVALUACIÓN, CENTRO DE PARTICIPACIÓN Y DIFUSIÓN UNIVERSITARIA' },
                { time: '12:30 - 13:00', name: 'MEDIOS UNIVERSITARIOS' }
            ]
        },
        {
            day: 'Viernes',
            color: [139, 92, 246], // Morado
            areas: [
                { time: '10:00 - 10:20', name: 'VILLAS IBERO' },
                { time: '10:20 - 10:40', name: 'PREPARATORIA IBERO' },
                { time: '10:40 - 11:00', name: 'MARKETING' },
                { time: '11:00 - 11:20', name: 'DIRECCIÓN DE COMUNICACIÓN INSTITUCIONAL' },
                { time: '11:20 - 11:40', name: 'DEFENSORÍA DE LOS DERECHOS UNIVERSITARIOS' },
                { time: '11:40 - 12:00', name: 'IBERO ACTÍVATE' },
                { time: '12:00 - 12:20', name: 'NUTRICIÓN, LAINES' },
                { time: '12:20 - 12:40', name: 'OFICINA DE ATENCIÓN TECNOLÓGICA' }
            ]
        }
    ];

    // --- LOOP THROUGH DAYS ---
    allRoutes.forEach(dayInfo => {
        // Checar espacio
        if (yPos + 80 > pageHeight) {
            doc.addPage();
            yPos = 30;
        }

        // Section Title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...dayInfo.color);
        doc.text(dayInfo.day, margin, yPos);

        // Line under title
        doc.setDrawColor(...dayInfo.color);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);

        yPos += 12;

        // Table Header
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 10, 'F');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("HORARIO", margin + 5, yPos + 1);
        doc.text("ÁREAS ASIGNADAS", margin + 50, yPos + 1);

        yPos += 10;

        // Route Items
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.setFontSize(11);

        dayInfo.areas.forEach((item, index) => {
            // Striping
            if (index % 2 !== 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margin, yPos - 5, pageWidth - (margin * 2), 10, 'F');
            }

            doc.text(item.time, margin + 5, yPos + 1);

            // Handle long text wrapping
            const splitName = doc.splitTextToSize(item.name, pageWidth - margin - 70);
            doc.text(splitName, margin + 50, yPos + 1);

            // Adjust yPos based on lines
            yPos += (6 * splitName.length) + 4;
        });

        yPos += 15; // Space between sections
    });

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);
    }

    doc.save('rutas-ibero-activate.pdf');
}
