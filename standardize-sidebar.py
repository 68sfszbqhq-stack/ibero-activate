#!/usr/bin/env python3
"""
Script para estandarizar el sidebar en TODOS los HTMLs admin
Asegura que todas las páginas tengan TODAS las opciones del menú
"""

import re
import glob
from pathlib import Path

# Sidebar completo (10 items)
STANDARD_SIDEBAR = '''        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <i class="fa-solid fa-heart-pulse"></i>
                <h2>IBERO ACTÍVATE</h2>
            </div>

            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link {CLASS_DASHBOARD}">
                        <i class="fa-solid fa-chart-line"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a href="program-overview.html" class="nav-link {CLASS_PROGRAM}">
                        <i class="fa-solid fa-calendar-star"></i> Programa 19 Semanas
                    </a>
                </li>
                <li class="nav-item">
                    <a href="calendar.html" class="nav-link {CLASS_CALENDAR}">
                        <i class="fa-solid fa-calendar-days"></i> Calendario
                    </a>
                </li>
                <li class="nav-item">
                    <a href="ai-reports.html" class="nav-link {CLASS_AI_REPORTS}">
                        <i class="fa-solid fa-sparkles"></i> Reportes IA
                    </a>
                </li>
                <li class="nav-item">
                    <a href="activities.html" class="nav-link {CLASS_ACTIVITIES}">
                        <i class="fa-solid fa-dumbbell"></i> Actividades
                    </a>
                </li>
                <li class="nav-item">
                    <a href="attendance.html" class="nav-link {CLASS_ATTENDANCE}">
                        <i class="fa-solid fa-clipboard-check"></i> Pase de Lista
                    </a>
                </li>
                <li class="nav-item">
                    <a href="attendance-late.html" class="nav-link {CLASS_ATTENDANCE_LATE}">
                        <i class="fa-solid fa-clock-rotate-left"></i> Pase Extemporáneo
                    </a>
                </li>
                <li class="nav-item">
                    <a href="employees.html" class="nav-link {CLASS_EMPLOYEES}">
                        <i class="fa-solid fa-user-plus"></i> Empleados
                    </a>
                </li>
                <li class="nav-item">
                    <a href="reports.html" class="nav-link {CLASS_REPORTS}">
                        <i class="fa-solid fa-file-pdf"></i> Reportes
                    </a>
                </li>
                <li class="nav-item">
                    <a href="#" class="nav-link {CLASS_GAMIFICATION}">
                        <i class="fa-solid fa-trophy"></i> Gamificación
                    </a>
                </li>
            </ul>

            <button onclick="logout()" class="nav-link logout-btn">
                <i class="fa-solid fa-sign-out-alt"></i> Cerrar Sesión
            </button>
        </aside>'''

# Mapeo de archivos a clases activas
ACTIVE_CLASS_MAP = {
    'dashboard.html': 'CLASS_DASHBOARD',
    'program-overview.html': 'CLASS_PROGRAM',
    'calendar.html': 'CLASS_CALENDAR',
    'ai-reports.html': 'CLASS_AI_REPORTS',
    'activities.html': 'CLASS_ACTIVITIES',
    'attendance.html': 'CLASS_ATTENDANCE',
    'attendance-late.html': 'CLASS_ATTENDANCE_LATE',
    'employees.html': 'CLASS_EMPLOYEES',
    'reports.html': 'CLASS_REPORTS',
}

def replace_sidebar(html_file):
    """Reemplaza el sidebar en un archivo HTML"""
    filename = Path(html_file).name
    
    # Leer archivo
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Determinar qué clase debe estar activa
    classes = {
        'CLASS_DASHBOARD': '',
        'CLASS_PROGRAM': '',
        'CLASS_CALENDAR': '',
        'CLASS_AI_REPORTS': '',
        'CLASS_ACTIVITIES': '',
        'CLASS_ATTENDANCE': '',
        'CLASS_ATTENDANCE_LATE': '',
        'CLASS_EMPLOYEES': '',
        'CLASS_REPORTS': '',
        'CLASS_GAMIFICATION': '',
    }
    
    if filename in ACTIVE_CLASS_MAP:
        classes[ACTIVE_CLASS_MAP[filename]] = 'active'
    
    # Reemplazar placeholders
    new_sidebar = STANDARD_SIDEBAR
    for key, value in classes.items():
        new_sidebar = new_sidebar.replace(f'{{{key}}}', value)
    
    # Buscar y reemplazar sidebar
    # Patrón: desde <aside class="sidebar"> hasta </aside>
    pattern = r'<aside class="sidebar">.*?</aside>'
    
    new_content = re.sub(
        pattern,
        new_sidebar.strip(),
        content,
        flags=re.DOTALL
    )
    
    # Si se hizo algún cambio
    if new_content != content:
        # Hacer backup
        backup_file = f"{html_file}.sidebar_backup"
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Escribir nuevo contenido
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return True
    
    return False

def main():
    print("🔧 Estandarizando sidebar en TODOS los archivos admin HTML...\n")
    
    # Buscar todos los HTML en admin
    html_files = glob.glob('admin/*.html')
    
    updated = 0
    skipped = 0
    
    for html_file in sorted(html_files):
        filename = Path(html_file).name
        
        # Saltar archivos que no son páginas principales
        if filename in ['sidebar-template.html', 'login.html']:
            skipped += 1
            continue
        
        if replace_sidebar(html_file):
            print(f"  ✅ {filename} - Sidebar actualizado")
            updated += 1
        else:
            print(f"  ⏭️  {filename} - Sin cambios")
    
    print(f"\n✅ Proceso completado!")
    print(f"📊 Archivos actualizados: {updated}")
    print(f"📊 Archivos omitidos: {skipped}")
    print(f"\n💡 Los backups fueron guardados con extensión .sidebar_backup")
    print(f"💡 Elimina los backups con: find admin -name '*.sidebar_backup' -delete")

if __name__ == '__main__':
    main()
