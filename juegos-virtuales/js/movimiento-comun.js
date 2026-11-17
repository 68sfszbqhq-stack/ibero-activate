/* ============================================================
   Base compartida de los juegos de movimiento:
   Carrera de Energía, Estatua Extrema y Reflejos de Oficina.

   - La pantalla (host) crea una sala de 4 letras y muestra un QR.
   - Cada celular entra con ?sala=XXXX y usa su acelerómetro como control.
   - Todo viaja por Realtime Database bajo laberinto/{SALA}, igual que el
     Laberinto y la Torre: así sirven las reglas que ya están publicadas
     (database.rules.json) y no hay que desplegar nada nuevo.
   ============================================================ */
(function () {
    firebase.initializeApp({
        apiKey: "AIzaSyCqQq-bXpNRwVDTlVjj27JWHEenmEUZUp4",
        authDomain: "pausas-activas-ibero-2026.firebaseapp.com",
        databaseURL: "https://pausas-activas-ibero-2026-default-rtdb.firebaseio.com",
        projectId: "pausas-activas-ibero-2026",
        appId: "1:358840395060:web:470d2d4a79db1d8a4f7161"
    });
    const rtdb = firebase.database();
    const URL_BASE = 'https://68sfszbqhq-stack.github.io/ibero-activate/juegos-virtuales/';

    // Diferencia entre el reloj del aparato y el del servidor, para que la
    // cuenta regresiva sea la misma en la pantalla y en todos los celulares.
    let offset = 0;
    rtdb.ref('.info/serverTimeOffset').on('value', s => { offset = s.val() || 0; });

    const M = {};
    M.rtdb = rtdb;
    M.TS = firebase.database.ServerValue.TIMESTAMP;
    M.ahora = () => Date.now() + offset;
    M.guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    M.leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    M.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    M.$ = id => document.getElementById(id);
    M.sala = (new URLSearchParams(location.search).get('sala') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    M.barajar = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    M.segundos = hasta => Math.max(0, Math.ceil((hasta - M.ahora()) / 1000));

    // ---------- Sala (pantalla) ----------
    M.crearSala = function (juego) {
        const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin I ni O
        const clave = 'mov_sala_' + juego;
        let sala = null;
        try { sala = sessionStorage.getItem(clave); } catch (e) {}
        while (!sala || sala === 'RANK') {
            sala = Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('');
        }
        try { sessionStorage.setItem(clave, sala); } catch (e) {}
        const ref = rtdb.ref('laberinto/' + sala);
        ref.update({ juego, creada: M.TS });
        const archivo = location.pathname.split('/').pop();
        const base = location.protocol === 'file:' ? URL_BASE + archivo : location.origin + location.pathname;
        return { sala, ref, url: base + '?sala=' + sala };
    };

    // Al cerrar o recargar la pestaña de la pantalla se borra la sala.
    // No se usa onDisconnect: un parpadeo del internet a media pausa borraría
    // a todos los jugadores.
    M.borrarAlSalir = ref => window.addEventListener('pagehide', () => { ref.remove(); });

    // Botones de opción (ej. 2 · 3 · 4 equipos). Devuelve una función para leer el valor.
    M.segmento = function (el, opciones, actual, alCambiar) {
        let valor = actual;
        el.classList.add('seg');
        el.innerHTML = opciones.map(o => `<button type="button" data-v="${o.v}">${o.t}</button>`).join('');
        const pintar = () => el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === String(valor)));
        el.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const o = opciones.find(x => String(x.v) === b.dataset.v);
            valor = o.v; pintar(); if (alCambiar) alCambiar(valor);
        });
        pintar();
        return () => valor;
    };

    M.qr = (el, texto, tam) => { el.innerHTML = ''; new QRCode(el, { text: texto, width: tam, height: tam }); };

    M.vigilarConexion = function () {
        const aviso = document.createElement('div');
        aviso.className = 'aviso-red oculto';
        document.body.appendChild(aviso);
        let yaConecto = false;
        setTimeout(() => {
            if (yaConecto) return;
            aviso.textContent = 'No se pudo conectar con el juego. Revisa el internet.';
            aviso.classList.remove('oculto');
        }, 10000);
        rtdb.ref('.info/connected').on('value', s => {
            if (s.val()) { yaConecto = true; aviso.classList.add('oculto'); }
            else if (yaConecto) { aviso.textContent = 'Sin conexión… reintentando'; aviso.classList.remove('oculto'); }
        });
    };

    // ---------- Sonidos (pantalla) ----------
    // En Zoom/Teams hay que marcar "Compartir sonido" al compartir pantalla.
    let ctx = null;
    M.sonar = function (tipo) {
        try {
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            const tonos = { tic: [660, .08], go: [880, .4], fin: [523, .7], caida: [160, .3], punto: [990, .12], error: [220, .35] };
            const [f, d] = tonos[tipo] || tonos.tic;
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = (tipo === 'caida' || tipo === 'error') ? 'sawtooth' : 'triangle';
            o.frequency.value = f;
            g.gain.setValueAtTime(.25, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d);
            o.connect(g).connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + d);
        } catch (e) {}
    };

    // ---------- Pantalla del celular encendida ----------
    M.mantenerPantalla = async function () {
        if (!('wakeLock' in navigator)) return;
        const pedir = async () => { try { await navigator.wakeLock.request('screen'); } catch (e) {} };
        await pedir();
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pedir(); });
    };

    // ---------- Sensor de movimiento ----------
    // s   = intensidad del movimiento (m/s², sin gravedad, suavizada)
    // rot = giro del celular (grados/s, suavizado)
    // alRep se dispara una vez por cada "golpe" de movimiento (una repetición).
    class Sensor {
        constructor() {
            this.s = 0; this.rot = 0; this.datos = false;
            this.arriba = false; this.ultimo = 0;
            this.alto = 3.0; this.bajo = 1.2; this.pausa = 280;
            this.base = null;
            this.alRep = null; this.alMover = null;
        }
        // Debe llamarse directo desde el toque de un botón (iPhone lo exige).
        async activar() {
            if (typeof DeviceMotionEvent === 'undefined') return false;
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                try { if (await DeviceMotionEvent.requestPermission() !== 'granted') return false; }
                catch (e) { return false; }
            }
            window.addEventListener('devicemotion', e => this._leer(e));
            await new Promise(r => setTimeout(r, 1200));
            return this.datos;
        }
        _leer(e) {
            let x, y, z;
            const a = e.acceleration;
            if (a && a.x != null) { x = a.x; y = a.y; z = a.z; }
            else {
                const g = e.accelerationIncludingGravity;
                if (!g || g.x == null) return;
                if (!this.base) this.base = { x: g.x, y: g.y, z: g.z };
                const b = this.base;
                b.x += .08 * (g.x - b.x); b.y += .08 * (g.y - b.y); b.z += .08 * (g.z - b.z);
                x = g.x - b.x; y = g.y - b.y; z = g.z - b.z;
            }
            this.datos = true;
            this.s = .6 * this.s + .4 * Math.hypot(x, y, z);
            const r = e.rotationRate;
            const rm = r ? Math.hypot(r.alpha || 0, r.beta || 0, r.gamma || 0) : 0;
            this.rot = .6 * this.rot + .4 * rm;
            const t = performance.now();
            if (!this.arriba && this.s > this.alto && t - this.ultimo > this.pausa) {
                this.arriba = true; this.ultimo = t;
                if (this.alRep) this.alRep();
            } else if (this.arriba && this.s < this.bajo) this.arriba = false;
            if (this.alMover) this.alMover(this.s, this.rot);
        }
    }
    M.Sensor = Sensor;

    // ---------- Entrar a la sala (celular) ----------
    // Pinta el formulario de nombre en #control y, al tocar "¡Estoy listo!",
    // pide permiso del sensor, registra al jugador y llama alListo(ctx).
    M.unirse = function ({ juego, titulo, emoji, alListo }) {
        const sala = M.sala;
        const caja = M.$('control');
        caja.classList.remove('oculto');
        const salaRef = rtdb.ref('laberinto/' + sala);
        let id = M.leer('mov_id_' + sala);
        if (!id) { id = 'j' + Math.random().toString(36).slice(2, 10); M.guardar('mov_id_' + sala, id); }

        caja.innerHTML = `
            <div class="emoji-titulo">${emoji}</div>
            <h1>${M.esc(titulo)}</h1>
            <div class="etiqueta">Sala <b class="codigo-chico">${sala}</b></div>
            <input id="u-nombre" maxlength="14" placeholder="Tu nombre" autocomplete="off" value="${M.esc(M.leer('mov_nombre') || '')}">
            <button class="btn-grande" id="u-listo">¡Estoy listo!</button>
            <p class="msg" id="u-msg">Al tocar el botón, permite el acceso al <b>movimiento</b>: así tu celular cuenta lo que haces.</p>`;
        const btn = M.$('u-listo'), msg = M.$('u-msg'), input = M.$('u-nombre');

        salaRef.child('juego').once('value').then(s => {
            if (s.val() !== juego) {
                msg.innerHTML = '<b>No encontré esa sala.</b> Revisa el código o escanea de nuevo el QR de la pantalla.';
                btn.disabled = true;
            }
        });

        btn.onclick = async () => {
            const nombre = input.value.trim().slice(0, 14);
            if (!nombre) { input.focus(); msg.textContent = 'Escribe tu nombre para entrar.'; return; }
            btn.disabled = true;
            const sensor = new Sensor();
            const conSensor = await sensor.activar();   // primero, por el permiso de iPhone
            M.guardar('mov_nombre', nombre);
            const yoRef = salaRef.child('jugadores/' + id);
            await yoRef.update({ nombre, entro: M.TS, sensor: conSensor, conectado: true });
            rtdb.ref('.info/connected').on('value', s => {
                if (!s.val()) return;
                yoRef.child('conectado').onDisconnect().set(false);
                yoRef.child('conectado').set(true);
            });
            // Si la pantalla se recarga, la sala se borra y se vuelve a crear con
            // el mismo código: aquí el celular se vuelve a anotar solo.
            salaRef.child('juego').on('value', s => {
                if (s.val() === juego) yoRef.update({ nombre, sensor: conSensor, conectado: true });
            });
            M.mantenerPantalla();
            alListo({ sala, salaRef, id, yoRef, nombre, sensor, conSensor });
        };
    };

    window.MOV = M;
})();
