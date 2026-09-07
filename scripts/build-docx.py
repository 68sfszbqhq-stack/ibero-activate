# -*- coding: utf-8 -*-
"""
Genera el .docx con la misma estructura y el mismo texto del documento del
Consejo de Directores, con una sola diferencia: bajo cada segmento van las
actividades reales del catálogo curado, en vez de los ejemplos sueltos.

    python3 scripts/build-docx.py

La clasificación se lee de scripts/datos-tablero.json, que produce
build-tablero.js. Así el Word y el tablero nunca se contradicen.
"""

import json
import os
import sys

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, 'scripts', 'datos-tablero.json')
SALIDA = os.path.join(RAIZ, 'Pausas Activas para el Cuidado de la Comunidad.docx')

FUENTE = 'Calibri'
TINTA = RGBColor(0x1F, 0x1F, 0x1F)
GRIS = RGBColor(0x60, 0x60, 0x60)
AMBAR = RGBColor(0x9A, 0x3C, 0x0A)

# El texto es del documento del Consejo de Directores. No se reescribe.
TITULO = ('“Pausas Activas para el Cuidado de la Comunidad: '
          'Movimiento con Sentido Ignaciano” (DOCUMENTO BASADO POR EL CONSEJO DE DIRECTORES)')

ENCABEZADO = 'Tres aspectos de la Identidad Ignaciana que se reflejarán en el proyecto'

ASPECTOS = [
    {
        'clave': 'cura',
        'titulo': '1. Cura Personalis (Cuidado Integral de la Persona)',
        'parrafo': ('La pausa activa reconocerá a cada colaborador como una persona integral '
                    'que necesita cuidar su salud física, emocional, social y espiritual.'),
    },
    {
        'clave': 'comunidad',
        'titulo': '2. Comunidad para el Bien Común',
        'parrafo': ('Las pausas activas promoverán la colaboración y el apoyo mutuo, '
                    'fortaleciendo la identidad universitaria y la construcción de una '
                    'comunidad más humana.'),
    },
    {
        'clave': 'magis',
        'titulo': '3. Magis y Servicio',
        'parrafo': ('Se impulsará el compromiso de dar lo mejor de sí al servicio de los demás, '
                    'favoreciendo una cultura de solidaridad, participación y corresponsabilidad.'),
    },
]

META = [
    ('Indicador Estratégico',
     'Porcentaje de participantes que manifiestan haber fortalecido su identidad institucional '
     'y la vivencia de valores ignacianos a través de las pausas activas.', False),
    ('Meta 2030',
     'Al menos el 85% de los colaboradores participantes manifestará que las pausas activas '
     'fortalecen su sentido de pertenencia, promueven valores institucionales y contribuyen a '
     'la construcción del bien común dentro de la comunidad universitaria.', False),
    ('Meta Anual',
     '80% de los participantes obtendrán una valoración favorable (4 o 5 en escala Likert) '
     'respecto al desarrollo de valores ignacianos y sentido de comunidad generado por las '
     'pausas activas.', True),
]


def raya(doc):
    """Línea horizontal, como las que separan las secciones del original."""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(10)
    pPr = p._p.get_or_add_pPr()
    bordes = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'BFBFBF')
    bordes.append(bottom)
    pPr.append(bordes)
    return p


# La jerarquía de viñetas se fija a mano. Las plantillas de Word definen
# 'List Bullet' y 'List Bullet 2' con la misma sangría, y entonces los dos
# niveles se ven iguales: se pierde qué actividad cuelga de qué segmento.
SANGRIA = {
    'List Bullet':   (Inches(0.25), Inches(-0.19)),
    'List Bullet 2': (Inches(0.62), Inches(-0.19)),
}


def texto(doc, contenido, size=11, bold=False, italic=False, color=TINTA,
          style=None, space_after=6, space_before=0):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.space_before = Pt(space_before)
    if style in SANGRIA:
        izq, colgante = SANGRIA[style]
        p.paragraph_format.left_indent = izq
        p.paragraph_format.first_line_indent = colgante
    r = p.add_run(contenido)
    r.font.name = FUENTE
    r.font.size = Pt(size)
    r.bold = bold
    r.italic = italic
    r.font.color.rgb = color
    return p


def titulo(doc, contenido, size, space_before=16, space_after=8):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(contenido)
    r.font.name = FUENTE
    r.font.size = Pt(size)
    r.bold = True
    r.font.color.rgb = TINTA
    return p


def main():
    if not os.path.exists(DATOS):
        sys.exit('✗ Falta scripts/datos-tablero.json. Corre antes: node scripts/build-tablero.js')

    d = json.load(open(DATOS, encoding='utf-8'))
    segmentos = d['segmentos']
    actividades = d['actividades']

    # Actividades agrupadas por segmento, en el orden del documento.
    por_segmento = {}
    for a in actividades:
        por_segmento.setdefault(a['segmento'], []).append(a)

    # El catálogo trae unos nombres dos veces (quedaron duplicados en
    # Firestore). En una lista para leer, se enseña una sola vez.
    repetidas = 0
    for clave, lista in por_segmento.items():
        lista.sort(key=lambda x: x['nombre'].lower())
        vistas, unicas = set(), []
        for a in lista:
            if a['nombre'] in vistas:
                repetidas += 1
                continue
            vistas.add(a['nombre'])
            unicas.append(a)
        por_segmento[clave] = unicas

    doc = Document()
    normal = doc.styles['Normal']
    normal.font.name = FUENTE
    normal.font.size = Pt(11)

    titulo(doc, TITULO, 13, space_before=0, space_after=14)
    titulo(doc, ENCABEZADO, 20, space_before=0, space_after=12)

    total_puestas = 0
    vacios = []

    for i, asp in enumerate(ASPECTOS):
        if i:
            raya(doc)
        titulo(doc, asp['titulo'], 15)
        texto(doc, asp['parrafo'], space_after=10)
        texto(doc, 'Ejemplos de actividades:', space_after=6)

        claves = [k for k, v in segmentos.items() if v.get('aspecto') == asp['clave']]
        for sk in claves:
            texto(doc, segmentos[sk]['nombre'] + '.', style='List Bullet',
                  bold=True, space_after=2)

            lista = por_segmento.get(sk, [])
            if not lista:
                vacios.append(segmentos[sk]['nombre'])
                texto(doc, 'Sin actividad asignada todavía.', style='List Bullet 2',
                      italic=True, color=AMBAR, size=10.5, space_after=2)
                continue

            for a in lista:
                minutos = f" ({a['duracion']} min)" if a.get('duracion') else ''
                texto(doc, a['nombre'] + minutos, style='List Bullet 2',
                      size=10.5, space_after=1)
                total_puestas += 1

    raya(doc)
    titulo(doc, 'Meta Crucial', 20)
    for rotulo, cuerpo, negritas in META:
        titulo(doc, rotulo, 11.5, space_before=10, space_after=4)
        texto(doc, cuerpo, bold=negritas, space_after=8)

    # Lo que no se pudo clasificar no se esconde: va al final, con su motivo.
    pendientes = por_segmento.get('por-clasificar', [])
    if pendientes or vacios:
        doc.add_page_break()
        titulo(doc, 'Anexo', 20, space_before=0)
        texto(doc,
              f'Del catálogo curado se colocaron {total_puestas} actividades en los '
              f'segmentos del documento. Aquí queda lo que falta resolver.',
              color=GRIS, size=10.5, space_after=12)

        if pendientes:
            titulo(doc, f'Actividades por clasificar · {len(pendientes)}', 13, space_before=4)
            texto(doc,
                  'Caben en dos segmentos a la vez. Se anota el motivo para decidirlas '
                  'en la reunión.', color=GRIS, size=10.5, space_after=8)
            for a in pendientes:
                minutos = f" ({a['duracion']} min)" if a.get('duracion') else ''
                texto(doc, a['nombre'] + minutos, style='List Bullet',
                      bold=True, size=10.5, space_after=1)
                if a.get('duda'):
                    texto(doc, a['duda'], style='List Bullet 2', italic=True,
                          color=GRIS, size=10, space_after=3)

        if vacios:
            titulo(doc, f'Segmentos sin actividad · {len(vacios)}', 13, space_before=14)
            texto(doc,
                  'El documento los pide y el catálogo todavía no tiene ninguna '
                  'actividad que les corresponda.', color=GRIS, size=10.5, space_after=8)
            for nombre in vacios:
                texto(doc, nombre, style='List Bullet', size=10.5, space_after=1)

    doc.save(SALIDA)

    print(f'✓ {os.path.basename(SALIDA)}')
    print(f'   {total_puestas} actividades colocadas en los segmentos')
    if pendientes:
        print(f'   {len(pendientes)} por clasificar → anexo')
    if vacios:
        print(f'   {len(vacios)} segmentos sin actividad: ' + ', '.join(vacios))
    if repetidas:
        print(f'   {repetidas} nombres repetidos del catálogo, mostrados una sola vez')


if __name__ == '__main__':
    main()
