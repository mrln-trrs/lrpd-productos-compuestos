/* Demo del módulo de productos compuestos — Casa Novedades Decor (datos de ejemplo). */
(function () {
  "use strict";

  // ------------------------------------------------------------ datos iniciales
  const INICIAL = {
    componentes: [
      { id: "MANT-01", nombre: "Mantel navideño rojo 1.8 m", stock: 14, precio: 35 },
      { id: "IND-04", nombre: "Individual bordado", stock: 40, precio: 6 },
      { id: "CEN-02", nombre: "Centro de mesa con piñas", stock: 9, precio: 28 },
      { id: "VEL-03", nombre: "Vela aromática canela", stock: 30, precio: 12 },
      { id: "POR-01", nombre: "Portavela de vidrio", stock: 18, precio: 9 },
      { id: "TOA-01", nombre: "Toalla de mano de algodón", stock: 25, precio: 15 },
      { id: "JAB-02", nombre: "Jabonera de cerámica", stock: 10, precio: 18 },
      { id: "DIF-01", nombre: "Difusor de varillas lavanda", stock: 12, precio: 25 },
    ],
    combos: [
      { id: "KIT-NAV", nombre: "Kit Mesa Navideña", precio: 75, activo: true,
        receta: [{ c: "MANT-01", n: 1 }, { c: "IND-04", n: 4 }, { c: "CEN-02", n: 1 }] },
      { id: "PACK-VEL", nombre: "Pack Velas Relax", precio: 55, activo: true,
        receta: [{ c: "VEL-03", n: 3 }, { c: "POR-01", n: 3 }] },
      { id: "SET-BAN", nombre: "Set Baño Spa", precio: 65, activo: true,
        receta: [{ c: "TOA-01", n: 2 }, { c: "JAB-02", n: 1 }, { c: "DIF-01", n: 1 }] },
    ],
    kardex: [],
  };
  const CLAVE = "cnd-demo-v1";
  const copia = (o) => JSON.parse(JSON.stringify(o));

  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* sin almacenamiento: se usa la versión en memoria */ }
    const d = copia(INICIAL);
    d.componentes.forEach((c) => d.kardex.push(mov("Saldo inicial", c.id, c.stock, 0, c.stock, "sistema")));
    return d;
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(db)); } catch (e) { /* ignorar */ }
  }
  function mov(op, comp, ent, sal, saldo, usuario) {
    return { t: new Date().toISOString(), u: usuario || usuarioActual(), op, comp, ent, sal, saldo };
  }

  let db;
  const $ = (s) => document.querySelector(s);
  const esc = (t) => String(t).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const soles = (n) => "S/ " + Number(n).toFixed(2);
  const comp = (id) => db.componentes.find((c) => c.id === id);
  const combo = (id) => db.combos.find((c) => c.id === id);
  const rol = () => $("#rol").value;
  const usuarioActual = () => (document.querySelector("#rol") ? (rol() === "ventas" ? "ventas01" : "almacen01") : "sistema");
  const maxArmables = (cb) => Math.min(...cb.receta.map((r) => Math.floor(comp(r.c).stock / r.n)));
  const limitante = (cb) => cb.receta.reduce((a, r) => (Math.floor(comp(r.c).stock / r.n) < Math.floor(comp(a.c).stock / a.n) ? r : a)).c;

  // ------------------------------------------------------------ pestañas
  function pestañas(selector, alCambiar) {
    const botones = document.querySelectorAll(selector);
    botones.forEach((b) => b.addEventListener("click", () => {
      botones.forEach((o) => {
        o.setAttribute("aria-selected", o === b ? "true" : "false");
        const id = o.getAttribute("aria-controls") || o.dataset.g;
        document.getElementById(id).hidden = o !== b;
      });
      if (alCambiar) alCambiar();
    }));
  }

  // ------------------------------------------------------------ venta
  function pintarSelectCombos() {
    const sel = $("#v-combo");
    const previo = sel.value;
    sel.innerHTML = db.combos.filter((c) => c.activo)
      .map((c) => `<option value="${c.id}">${esc(c.nombre)} · ${soles(c.precio)}</option>`).join("");
    if ([...sel.options].some((o) => o.value === previo)) sel.value = previo;
  }

  function pintarValidacion() {
    const cb = combo($("#v-combo").value);
    const cant = Math.max(1, parseInt($("#v-cant").value, 10) || 1);
    const cuerpo = $("#v-check");
    if (!cb) { cuerpo.innerHTML = ""; $("#v-max").textContent = "No hay combos activos."; $("#v-vender").disabled = true; return; }
    let alcanza = true;
    cuerpo.innerHTML = cb.receta.map((r) => {
      const c = comp(r.c);
      const nec = r.n * cant;
      const ok = c.stock >= nec;
      if (!ok) alcanza = false;
      return `<tr><td>${esc(c.nombre)}</td><td>${nec}</td><td>${c.stock}</td><td>${ok ? c.stock - nec : "—"}</td>
        <td><span class="chip ${ok ? "ok" : "no"}">${ok ? "Alcanza" : "Falta " + (nec - c.stock)}</span></td></tr>`;
    }).join("");
    const max = maxArmables(cb);
    $("#v-max").textContent = `Con el stock actual se pueden vender hasta ${max} «${cb.nombre}». Lo limita: ${comp(limitante(cb)).nombre}.`;
    $("#v-vender").disabled = !alcanza || rol() !== "ventas";
    $("#v-devolver").disabled = rol() !== "ventas";
    if (rol() !== "ventas") mensaje("#v-msg", "El rol Almacén no registra ventas (RNF-003). Cambia a ventas01.", false);
  }

  function vender(e) {
    e.preventDefault();
    const cb = combo($("#v-combo").value);
    const cant = Math.max(1, parseInt($("#v-cant").value, 10) || 1);
    if (!cb || rol() !== "ventas") return;
    const falta = cb.receta.find((r) => comp(r.c).stock < r.n * cant);
    if (falta) { mensaje("#v-msg", `Venta bloqueada: no alcanza ${comp(falta.c).nombre}.`, false); return; }
    cb.receta.forEach((r) => {
      const c = comp(r.c);
      c.stock -= r.n * cant;
      db.kardex.push(mov(`Venta ${cant} × ${cb.nombre}`, c.id, 0, r.n * cant, c.stock));
    });
    guardar();
    mensaje("#v-msg", `Venta registrada: ${cant} × ${cb.nombre} (${soles(cb.precio * cant)}). Se descontaron ${cb.receta.length} componentes.`, true);
    refrescar(cb.receta.length);
  }

  function devolver() {
    const cb = combo($("#v-combo").value);
    const cant = Math.max(1, parseInt($("#v-cant").value, 10) || 1);
    if (!cb || rol() !== "ventas") return;
    cb.receta.forEach((r) => {
      const c = comp(r.c);
      c.stock += r.n * cant;
      db.kardex.push(mov(`Devolución ${cant} × ${cb.nombre}`, c.id, r.n * cant, 0, c.stock));
    });
    guardar();
    mensaje("#v-msg", `Devolución registrada: los componentes de ${cant} × ${cb.nombre} reingresaron al stock.`, true);
    refrescar(cb.receta.length);
  }

  // ------------------------------------------------------------ combos
  let editando = null;

  function pintarCombos() {
    $("#c-lista").innerHTML = db.combos.map((cb) => `
      <div class="combo-item ${cb.activo ? "" : "off"}">
        <header><strong>${esc(cb.nombre)}</strong><span>${soles(cb.precio)} <span class="chip ${cb.activo ? "ok" : "off"}">${cb.activo ? "Activo" : "Inactivo"}</span></span></header>
        <ul>${cb.receta.map((r) => `<li>${r.n} × ${esc(comp(r.c).nombre)}</li>`).join("")}</ul>
        <div class="acts">
          <button class="btn btn-small btn-ghost" data-edit="${cb.id}">Editar</button>
          <button class="btn btn-small btn-ghost" data-toggle="${cb.id}">${cb.activo ? "Desactivar" : "Activar"}</button>
        </div>
      </div>`).join("");
    const puede = rol() === "almacen";
    $("#c-permiso").hidden = puede;
    document.querySelectorAll("#form-combo input, #form-combo select, #form-combo button, [data-edit], [data-toggle]")
      .forEach((el) => { el.disabled = !puede; });
  }

  function filaItem(c, n) {
    const div = document.createElement("div");
    div.className = "item-row";
    div.innerHTML = `<select aria-label="Componente">${db.componentes.map((x) => `<option value="${x.id}" ${x.id === c ? "selected" : ""}>${esc(x.nombre)}</option>`).join("")}</select>
      <input type="number" min="1" value="${n || 1}" aria-label="Cantidad">
      <button type="button" aria-label="Quitar componente">×</button>`;
    div.querySelector("button").addEventListener("click", () => div.remove());
    $("#c-items").appendChild(div);
  }

  function limpiarForm() {
    editando = null;
    $("#form-combo").reset();
    $("#c-items").innerHTML = "";
    filaItem(db.componentes[0].id, 1);
    filaItem(db.componentes[1].id, 1);
    $("#c-titulo").firstChild.textContent = "Nuevo combo ";
    $("#c-cancelar").hidden = true;
  }

  function editar(id) {
    const cb = combo(id);
    editando = id;
    $("#c-nombre").value = cb.nombre;
    $("#c-precio").value = cb.precio;
    $("#c-items").innerHTML = "";
    cb.receta.forEach((r) => filaItem(r.c, r.n));
    $("#c-titulo").firstChild.textContent = "Editar combo ";
    $("#c-cancelar").hidden = false;
    $("#c-nombre").focus();
  }

  function guardarCombo(e) {
    e.preventDefault();
    if (rol() !== "almacen") return;
    const nombre = $("#c-nombre").value.trim();
    const precio = parseFloat($("#c-precio").value);
    const receta = {};
    document.querySelectorAll("#c-items .item-row").forEach((row) => {
      const c = row.querySelector("select").value;
      const n = parseInt(row.querySelector("input").value, 10);
      if (n > 0) receta[c] = (receta[c] || 0) + n;
    });
    const lista = Object.entries(receta).map(([c, n]) => ({ c, n }));
    if (!nombre || !(precio >= 0)) { mensaje("#c-msg", "Completa el nombre y el precio.", false); return; }
    if (lista.length < 2) { mensaje("#c-msg", "Un combo necesita al menos dos componentes distintos.", false); return; }
    if (editando) {
      Object.assign(combo(editando), { nombre, precio, receta: lista });
      mensaje("#c-msg", `Combo «${nombre}» actualizado.`, true);
    } else {
      const id = "CMB-" + String(db.combos.length + 1).padStart(2, "0");
      db.combos.push({ id, nombre, precio, activo: true, receta: lista });
      mensaje("#c-msg", `Combo «${nombre}» registrado. Ya aparece en la venta.`, true);
    }
    guardar();
    limpiarForm();
    refrescar();
  }

  // ------------------------------------------------------------ inventario
  function pintarInventario(nuevos) {
    $("#i-stock").innerHTML = db.componentes.map((c) => {
      const usos = db.combos.filter((cb) => cb.activo && cb.receta.some((r) => r.c === c.id)).map((cb) => cb.nombre);
      return `<tr><td>${c.id}</td><td>${esc(c.nombre)}</td><td><b>${c.stock}</b></td><td>${soles(c.precio)}</td><td>${esc(usos.join(", ") || "—")}</td></tr>`;
    }).join("");
    $("#i-reporte").innerHTML = db.combos.map((cb) => `<tr><td>${esc(cb.nombre)}</td>
      <td><span class="chip ${cb.activo ? "ok" : "off"}">${cb.activo ? "Activo" : "Inactivo"}</span></td>
      <td>${cb.receta.map((r) => `${r.n} × ${esc(comp(r.c).nombre)}`).join("<br>")}</td>
      <td><b>${maxArmables(cb)}</b></td><td>${esc(comp(limitante(cb)).nombre)}</td></tr>`).join("");
    const filas = db.kardex.slice().reverse();
    $("#i-kardex").innerHTML = filas.map((k, i) => `<tr class="${i < (nuevos || 0) ? "flash" : ""}">
      <td>${new Date(k.t).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "medium" })}</td><td>${k.u}</td><td>${esc(k.op)}</td>
      <td>${esc(comp(k.comp).nombre)}</td><td>${k.ent || ""}</td><td>${k.sal || ""}</td><td><b>${k.saldo}</b></td></tr>`).join("");
  }

  function mensaje(sel, texto, ok) {
    const el = $(sel);
    el.textContent = texto;
    el.className = "msg " + (ok ? "ok" : "err");
  }

  function refrescar(nuevos) {
    pintarSelectCombos();
    pintarValidacion();
    pintarCombos();
    pintarInventario(nuevos);
  }

  // ------------------------------------------------------------ inicio
  document.addEventListener("DOMContentLoaded", () => {
    db = cargar();
    pestañas(".tabs [role=tab]");
    $("#form-venta").addEventListener("submit", vender);
    $("#v-devolver").addEventListener("click", devolver);
    $("#v-combo").addEventListener("change", pintarValidacion);
    $("#v-cant").addEventListener("input", pintarValidacion);
    $("#rol").addEventListener("change", () => { mensaje("#v-msg", "", true); mensaje("#c-msg", "", true); refrescar(); });
    $("#form-combo").addEventListener("submit", guardarCombo);
    $("#c-add").addEventListener("click", () => filaItem(db.componentes[0].id, 1));
    $("#c-cancelar").addEventListener("click", limpiarForm);
    $("#c-lista").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), tg = e.target.closest("[data-toggle]");
      if (ed) editar(ed.dataset.edit);
      if (tg) {
        const cb = combo(tg.dataset.toggle);
        cb.activo = !cb.activo;
        guardar(); refrescar();
      }
    });
    $("#reset").addEventListener("click", () => {
      try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
      db = cargar(); limpiarForm(); mensaje("#v-msg", "Datos reiniciados.", true); refrescar();
    });
    limpiarForm();
    refrescar();
  });
})();
