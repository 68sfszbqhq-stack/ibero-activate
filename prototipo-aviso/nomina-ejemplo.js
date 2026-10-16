/* ============================================================
   PROTOTIPO — Nómina de EJEMPLO (personas inventadas)
   ============================================================
   Mismo formato que la colección `employees` de Firestore:
     { fullName, accountNumber, areaId }
   En la versión real esto no existe: se consulta Firestore.
   Aquí sirve para probar el flujo sin tocar datos de nadie.
   ============================================================ */

const NOMINA_EJEMPLO = [
    { accountNumber: '100201', fullName: 'María Fernanda Aguilar Ruiz',   areaId: 'Admisiones' },
    { accountNumber: '100202', fullName: 'Jorge Alberto Cruz Medina',     areaId: 'Admisiones' },
    { accountNumber: '100203', fullName: 'Ana Lucía Hernández Pérez',     areaId: 'Admisiones' },
    { accountNumber: '100204', fullName: 'Ricardo Solís Vázquez',         areaId: 'Admisiones' },
    { accountNumber: '100205', fullName: 'Diana Patricia Rojas Luna',     areaId: 'Admisiones' },
    { accountNumber: '100206', fullName: 'Emilio Castro Bautista',        areaId: 'Admisiones' },
    { accountNumber: '100207', fullName: 'Sofía Márquez Delgado',         areaId: 'Admisiones' },
    { accountNumber: '100208', fullName: 'Luis Ángel Torres Ramírez',     areaId: 'Admisiones' },

    { accountNumber: '100301', fullName: 'Gabriela Ortiz Sandoval',       areaId: 'Recursos Humanos' },
    { accountNumber: '100302', fullName: 'Héctor Manuel Ibáñez Flores',   areaId: 'Recursos Humanos' },
    { accountNumber: '100303', fullName: 'Paulina Vega Contreras',        areaId: 'Recursos Humanos' },
    { accountNumber: '100304', fullName: 'Andrés Felipe Núñez Salas',     areaId: 'Recursos Humanos' },
    { accountNumber: '100305', fullName: 'Rosa Elena Guzmán Ávila',       areaId: 'Recursos Humanos' },

    { accountNumber: '100401', fullName: 'Fernando Escobar Peña',         areaId: 'Tesorería' },
    { accountNumber: '100402', fullName: 'Claudia Jiménez Morales',       areaId: 'Tesorería' },
    { accountNumber: '100403', fullName: 'Óscar Iván Ramos Cabrera',      areaId: 'Tesorería' },
    { accountNumber: '100404', fullName: 'Verónica Lara Domínguez',       areaId: 'Tesorería' }
];

/* Quita acentos y mayúsculas para poder comparar sin pelearse con la ortografía */
function normalizar(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/* Busca por número de cuenta y comprueba que el apellido escrito sea suyo.
   Devuelve { ok, persona, motivo } — nunca revela el nombre si el apellido no cuadra. */
function buscarEnNomina(numeroCuenta, apellido, nomina) {
    const lista = nomina || NOMINA_EJEMPLO;
    const num = String(numeroCuenta || '').trim();
    if (!num) return { ok: false, motivo: 'falta-numero' };

    const persona = lista.find((p) => String(p.accountNumber).trim() === num);
    if (!persona) return { ok: false, motivo: 'no-existe' };

    const escrito = normalizar(apellido);
    if (!escrito) return { ok: false, motivo: 'falta-apellido' };

    // Basta con que lo escrito coincida con alguna palabra del nombre completo
    const partes = normalizar(persona.fullName).split(' ');
    const cuadra = partes.some((p) => p === escrito) || normalizar(persona.fullName).includes(escrito);
    if (!cuadra) return { ok: false, motivo: 'no-cuadra' };

    return { ok: true, persona };
}
