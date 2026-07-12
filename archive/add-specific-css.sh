#!/bin/bash

# Agregar CSS específicos a los HTMLs que los necesitan

echo "🎨 Agregando CSS específicos a HTMLs..."

# Program Overview
if grep -q "program-overview.css" "admin/program-overview.html"; then
    echo "  ⏭️  program-overview.html ya tiene program-overview.css"
else
    sed -i '' 's|<link rel="stylesheet" href="../css/admin.css">|<link rel="stylesheet" href="../css/admin.css">\
    <link rel="stylesheet" href="../css/program-overview.css">|' "admin/program-overview.html"
    echo "  ✅ program-overview.html actualizado"
fi

# Dashboard (admin y employee)
for file in admin/dashboard.html employee/dashboard.html; do
    if grep -q "dashboard.css" "$file"; then
        echo "  ⏭️  $file ya tiene dashboard.css"
    else
        if grep -q 'admin.css' "$file"; then
            sed -i '' 's|<link rel="stylesheet" href="../css/admin.css">|<link rel="stylesheet" href="../css/admin.css">\
    <link rel="stylesheet" href="../css/dashboard.css">|' "$file"
        elif grep -q 'employee.css' "$file"; then
            sed -i '' 's|<link rel="stylesheet" href="../css/employee.css">|<link rel="stylesheet" href="../css/employee.css">\
    <link rel="stylesheet" href="../css/dashboard.css">|' "$file"
        fi
        echo "  ✅ $file actualizado"
    fi
done

# Activities
if grep -q "activities.css" "admin/activities.html"; then
    echo "  ⏭️  activities.html ya tiene activities.css"
else
    sed -i '' 's|<link rel="stylesheet" href="../css/admin.css">|<link rel="stylesheet" href="../css/admin.css">\
    <link rel="stylesheet" href="../css/activities.css">|' "admin/activities.html"
    echo "  ✅ activities.html actualizado"
fi

echo ""
echo "✅ CSS específicos agregados!"
