/* Interacciones del portafolio: navegación, animaciones, presentación, etapas, cronograma, gráficos y visor. */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const HOY = new Date();
  const fecha = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const corta = (s) => { const [, m, d] = s.split("-"); return `${d}/${m}`; };
  const DIA = 86400000;
  const INI = fecha("2026-08-24"), FIN = fecha("2026-12-28");

  /* ---------------- navegación ---------------- */
  function navegacion() {
    const nav = $("#nav"), barra = $("#progreso");
    const enlaces = $$("#menu a");
    const secciones = enlaces.map((a) => $(a.getAttribute("href")));
    const alDesplazar = () => {
      const h = document.documentElement;
      barra.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
      nav.classList.toggle("scrolled", h.scrollTop > 40);
      let activa = -1;
      secciones.forEach((s, i) => { if (s && s.getBoundingClientRect().top < 140) activa = i; });
      enlaces.forEach((a, i) => a.classList.toggle("active", i === activa));
    };
    addEventListener("scroll", alDesplazar, { passive: true });
    alDesplazar();
    const btn = $(".nav-toggle"), menu = $("#menu");
    btn.addEventListener("click", () => { const o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
    menu.addEventListener("click", (e) => { if (e.target.tagName === "A") { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }

  /* ---------------- aparición y contadores ---------------- */
  function animaciones() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        $$(".count", e.target).forEach(contar);
        if (e.target.classList.contains("count")) contar(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
    function contar(el) {
      if (el.dataset.done) return;
      el.dataset.done = 1;
      const fin = +el.dataset.to;
      if (reduce) { el.textContent = fin.toLocaleString("es-PE"); return; }
      const t0 = performance.now(), dur = 1400;
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(fin * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString("es-PE");
        if (k < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
  }

  /* ---------------- estado del proyecto ---------------- */
  function fasesNivel2() { return TAREAS.filter((t) => t[3] === 2); }
  function estadoProyecto() {
    const pct = Math.max(0, Math.min(100, Math.round(((HOY - INI) / (FIN - INI)) * 100)));
    const actuales = fasesNivel2().filter((t) => fecha(t[4]) <= HOY && HOY <= fecha(t[5]) - 0 + DIA).map((t) => t[2]);
    let etiqueta = "En ejecución";
    if (HOY < INI) etiqueta = "Por iniciar";
    if (HOY > FIN) etiqueta = "Proyecto cerrado";
    $("#estado-proyecto").innerHTML = `
      <div class="st-top"><span class="st-dot"></span><b>${etiqueta}</b><span>${pct} % del cronograma transcurrido</span></div>
      <div class="st-bar"><span style="width:${pct}%"></span></div>
      <p>${actuales.length ? "Fases en curso hoy: " + actuales.join(" · ") : "Línea base: 24/08/2026 → 28/12/2026"}</p>`;
  }

  /* ---------------- presentación ---------------- */
  function presentacion() {
    const deck = $("#deck"), stage = $("#deck-stage"), slides = $$(".slide", stage);
    const dots = $("#dk-dots");
    let i = 0;
    slides.forEach((_, k) => {
      const b = document.createElement("button");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Diapositiva " + (k + 1));
      b.addEventListener("click", () => ir(k));
      dots.appendChild(b);
    });
    function ir(k) {
      i = (k + slides.length) % slides.length;
      stage.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, n) => { s.classList.toggle("on", n === i); s.setAttribute("aria-hidden", n !== i); });
      $$("button", dots).forEach((b, n) => b.setAttribute("aria-selected", n === i));
      $("#dk-count").textContent = `${i + 1} / ${slides.length}`;
    }
    $("#dk-prev").addEventListener("click", () => ir(i - 1));
    $("#dk-next").addEventListener("click", () => ir(i + 1));
    deck.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { ir(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { ir(i - 1); e.preventDefault(); }
    });
    let x0 = null;
    stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    $("#dk-full").addEventListener("click", () => pantallaCompleta(deck));
    ir(0);
  }

  function pantallaCompleta(el) {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  }

  /* ---------------- etapas ---------------- */
  const ETAPAS = [
    { n: "Inicio", ini: "2026-08-24", fin: "2026-09-08", ent: ["Entrevistas con el patrocinador", "Acta de constitución", "Registro de interesados", "Hito: acta firmada (08/09)"] },
    { n: "Planificación", ini: "2026-09-09", fin: "2026-10-05", ent: ["Lista de requerimientos (9 RF, 6 RNF)", "Plan de gestión del alcance", "EDT / WBS", "Cronograma en ProjectLibre", "Costos y presupuesto", "Plan de riesgos y comunicaciones"] },
    { n: "Ejecución", ini: "2026-10-06", fin: "2026-11-23", ent: ["Reuniones de coordinación semanales", "Asignación y supervisión de tareas", "Análisis AS-IS / TO-BE y reglas BOM", "Diseño de BD de despiece y Kardex", "Construcción de los módulos del ERP"] },
    { n: "Monitoreo y control", ini: "2026-11-24", fin: "2026-12-14", ent: ["Control de avance con valor ganado", "Control de solicitudes de cambio", "Pruebas de balance del Kardex y usabilidad", "Corrección de errores", "Validación y aceptación de entregables"] },
    { n: "Cierre", ini: "2026-12-15", fin: "2026-12-28", ent: ["Informe final del proyecto", "Lecciones aprendidas", "Despliegue, manual y capacitación", "Cierre administrativo y firma", "Hito: cierre del proyecto (28/12)"] },
  ];
  function estadoDe(e) {
    if (HOY > fecha(e.fin)) return ["done", "Completada"];
    if (HOY >= fecha(e.ini)) return ["now", "En curso"];
    return ["next", "Pendiente"];
  }
  function etapas() {
    const cont = $("#stages");
    cont.innerHTML = ETAPAS.map((e, k) => {
      const [c, t] = estadoDe(e);
      const dur = Math.round((fecha(e.fin) - fecha(e.ini)) / DIA) + 1;
      const av = c === "done" ? 100 : c === "next" ? 0 : Math.round(((HOY - fecha(e.ini)) / (fecha(e.fin) - fecha(e.ini) + DIA)) * 100);
      return `<button class="stage ${c}" role="tab" aria-selected="false" data-k="${k}">
        <span class="sg-num">${k + 1}</span><b>${e.n}</b><small>${corta(e.ini)} – ${corta(e.fin)} · ${dur} días</small>
        <span class="sg-state">${t}</span><span class="sg-bar"><i style="width:${av}%"></i></span></button>`;
    }).join("");
    const elegir = (k) => {
      $$(".stage", cont).forEach((b, n) => b.setAttribute("aria-selected", n === k));
      const e = ETAPAS[k], [c, t] = estadoDe(e);
      $("#stage-detail").innerHTML = `<div class="sd-head"><span class="sd-state ${c}">${t}</span><h3>${e.n}</h3><span>${corta(e.ini)}/2026 – ${corta(e.fin)}/2026</span></div>
        <ul>${e.ent.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    };
    cont.addEventListener("click", (ev) => { const b = ev.target.closest(".stage"); if (b) elegir(+b.dataset.k); });
    const actual = ETAPAS.findIndex((e) => estadoDe(e)[0] === "now");
    elegir(actual >= 0 ? actual : HOY > FIN ? ETAPAS.length - 1 : 0);
  }

  /* ---------------- pestañas de planes ---------------- */
  function planes() {
    const btns = $$(".plan-tabs [role=tab]");
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((o) => { o.setAttribute("aria-selected", o === b); $("#" + o.dataset.p).hidden = o !== b; });
    }));
  }

  /* ---------------- cronograma (Gantt) ---------------- */
  function gantt() {
    const cont = $("#gantt");
    const t0 = fecha("2026-08-17"), t1 = fecha("2027-01-04");
    const total = (t1 - t0) / DIA;
    const pos = (d) => (((fecha(d) - t0) / DIA) / total) * 100;
    const ancho = (a, b) => Math.max(0.6, ((fecha(b) - fecha(a)) / DIA + 1) / total * 100);
    const meses = [["Ago", "2026-08-17"], ["Set", "2026-09-01"], ["Oct", "2026-10-01"], ["Nov", "2026-11-01"], ["Dic", "2026-12-01"], ["Ene", "2027-01-01"]];
    const porId = Object.fromEntries(TAREAS.map((t) => [t[0], t]));
    const padre = {};
    const pila = [];
    TAREAS.forEach((t) => {
      while (pila.length && pila[pila.length - 1][3] >= t[3]) pila.pop();
      padre[t[0]] = pila.length ? pila[pila.length - 1][0] : null;
      pila.push(t);
    });
    const tieneHijos = new Set(Object.values(padre).filter(Boolean));
    const rama = (id) => { let r = id; while (padre[r]) r = padre[r]; return porId[r][1] === "1" ? "pm" : "dev"; };
    let html = `<div class="gt-inner"><div class="gt-head"><div class="gt-name">Tarea</div><div class="gt-time">${meses.map(([m, d]) => `<span style="left:${pos(d)}%">${m}</span>`).join("")}</div></div><div class="gt-body">`;
    TAREAS.forEach((t) => {
      const [id, wbs, n, lvl, a, b, hito, pred] = t;
      const resumen = tieneHijos.has(id);
      const preds = pred.map((p) => porId[p][1] + " " + porId[p][2]).join(", ");
      const tip = `${wbs} ${n}\n${corta(a)} → ${corta(b)}${preds ? "\nDepende de: " + preds : ""}`;
      const est = fecha(b) < HOY ? "hecha" : fecha(a) <= HOY ? "curso" : "";
      html += `<div class="gt-row lvl${lvl} ${resumen ? "sum" : ""}" data-id="${id}" data-padre="${padre[id] || ""}">
        <div class="gt-name">${resumen ? `<button class="gt-tog" aria-expanded="true" aria-label="Contraer ${n}">▾</button>` : "<span class='gt-sp'></span>"}<span class="gt-wbs">${wbs}</span><span class="gt-n">${n}</span></div>
        <div class="gt-time">${hito ? `<span class="gt-ms" style="left:${pos(a)}%" title="${tip}"></span><span class="gt-mslbl" style="left:${pos(a)}%">${corta(a)}</span>`
          : `<span class="gt-bar ${rama(id)} ${resumen ? "sumbar" : ""} ${est}" style="left:${pos(a)}%;width:${ancho(a, b)}%" title="${tip}"></span>`}</div></div>`;
    });
    html += `</div><span class="gt-today" style="left:calc(var(--gt-name) + (100% - var(--gt-name)) * ${pos(HOY.toISOString().slice(0, 10)) / 100})" title="Hoy"></span></div>`;
    cont.innerHTML = html;
    if (HOY < t0 || HOY > t1) $(".gt-today", cont).remove();

    const filas = $$(".gt-row", cont);
    const ocultarDesc = (id, ocultar) => filas.filter((r) => r.dataset.padre === String(id)).forEach((r) => {
      r.hidden = ocultar;
      if (r.classList.contains("sum")) {
        const abierto = $(".gt-tog", r).getAttribute("aria-expanded") === "true";
        ocultarDesc(r.dataset.id, ocultar || !abierto);
      }
    });
    cont.addEventListener("click", (e) => {
      const b = e.target.closest(".gt-tog");
      if (!b) return;
      const abierto = b.getAttribute("aria-expanded") === "true";
      b.setAttribute("aria-expanded", !abierto);
      b.textContent = abierto ? "▸" : "▾";
      ocultarDesc(b.closest(".gt-row").dataset.id, abierto);
    });
    const todos = (abrir) => {
      filas.forEach((r) => {
        const tg = $(".gt-tog", r);
        if (tg && r.classList.contains("lvl2")) { tg.setAttribute("aria-expanded", abrir); tg.textContent = abrir ? "▾" : "▸"; }
        if (tg && !r.classList.contains("lvl2")) { tg.setAttribute("aria-expanded", "true"); tg.textContent = "▾"; }
        r.hidden = !abrir && r.classList.contains("lvl3");
      });
    };
    $("#g-expand").addEventListener("click", () => todos(true));
    $("#g-collapse").addEventListener("click", () => todos(false));
  }

  /* ---------------- curva S, riesgos y EVM ---------------- */
  function curvaS() {
    const datos = [["Ago", 10.23], ["Set", 127.73], ["Oct", 385.23], ["Nov", 858.52], ["Dic", 1100]];
    const W = 540, H = 290, m = { l: 56, r: 20, t: 24, b: 34 };
    const x = (i) => m.l + (i * (W - m.l - m.r)) / (datos.length - 1);
    const y = (v) => H - m.b - (v / 1200) * (H - m.t - m.b);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva S: costo planificado acumulado de S/ 10.23 en agosto a S/ 1,100 en diciembre"><defs><linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d30040" stop-opacity=".28"/><stop offset="1" stop-color="#d30040" stop-opacity="0"/></linearGradient></defs>`;
    [0, 300, 600, 900, 1200].forEach((v) => { s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#64748b">${v}</text>`; });
    const pts = datos.map((d, i) => `${x(i)},${y(d[1])}`).join(" ");
    s += `<polygon points="${x(0)},${y(0)} ${pts} ${x(4)},${y(0)}" fill="url(#gS)"/>`;
    s += `<polyline class="draw" points="${pts}" fill="none" stroke="#9c0028" stroke-width="3" stroke-linejoin="round"/>`;
    datos.forEach((d, i) => {
      s += `<circle cx="${x(i)}" cy="${y(d[1])}" r="5" fill="#fff" stroke="#9c0028" stroke-width="2.5"><title>${d[0]} 2026: S/ ${d[1].toFixed(2)}</title></circle><text x="${x(i)}" y="${H - 12}" text-anchor="middle" font-size="12" fill="#64748b">${d[0]}</text>`;
    });
    s += `<text x="${x(4) - 8}" y="${y(1100) - 10}" text-anchor="end" font-size="12" font-weight="700" fill="#1e293b">BAC S/ 1,100</text>`;
    $("#curva").innerHTML = s + "</svg>";
  }

  function mapaRiesgos() {
    const R = [["R-01", 4, 4], ["R-02", 3, 5], ["R-03", 3, 5], ["R-04", 3, 3], ["R-05", 3, 3], ["R-06", 3, 4]];
    let h = "";
    for (let p = 5; p >= 1; p--) {
      h += `<div class="lbl">${p}</div>`;
      for (let i = 1; i <= 5; i++) {
        const e = p * i, c = e >= 15 ? "c3" : e >= 8 ? "c2" : "c1";
        h += `<div class="cell ${c}">${R.filter((r) => r[1] === p && r[2] === i).map((r) => `<span class="r">${r[0]}</span>`).join("")}</div>`;
      }
    }
    h += `<div></div>` + [1, 2, 3, 4, 5].map((i) => `<div class="lbl">${i}</div>`).join("");
    $("#heat").innerHTML = h;
  }

  function evm() {
    const pct = 358.52 / 1100, r = 70, c = 2 * Math.PI * r;
    $("#evm-gauge").innerHTML = `<svg viewBox="0 0 180 180" role="img" aria-label="Valor planificado al 29/10: 33 % del presupuesto">
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="#f1d5dd" stroke-width="16"/>
      <circle class="ring" cx="90" cy="90" r="${r}" fill="none" stroke="#9c0028" stroke-width="16" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" style="--off:${c * (1 - pct)}" transform="rotate(-90 90 90)"/>
      <text x="90" y="88" text-anchor="middle" font-size="34" font-weight="800" fill="#1e293b" font-family="Montserrat">33%</text>
      <text x="90" y="112" text-anchor="middle" font-size="12" fill="#64748b">PV / BAC</text></svg>`;
  }

  /* ---------------- zoom de imágenes y lightbox ---------------- */
  function zoom() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-zoom]");
      if (b) {
        const img = document.getElementById(b.dataset.target);
        const z = Math.min(3, Math.max(0.5, (+img.dataset.z || 1) + 0.25 * +b.dataset.zoom));
        img.dataset.z = z;
        img.style.width = 1600 * z + "px";
      }
      const lb = e.target.closest("[data-lightbox]");
      if (lb) abrirLightbox(`<img src="${lb.dataset.lightbox}" alt="">`);
    });
    $("#lb-close").addEventListener("click", cerrarLightbox);
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") cerrarLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarLightbox(); });
  }
  function abrirLightbox(html) { $("#lb-body").innerHTML = html; $("#lightbox").hidden = false; document.body.style.overflow = "hidden"; $("#lb-close").focus(); }
  function cerrarLightbox() { if ($("#lightbox").hidden) return; $("#lightbox").hidden = true; $("#lb-body").innerHTML = ""; document.body.style.overflow = ""; }

  /* ---------------- visor de documentos ---------------- */
  const DOCS = {
    informe: { t: "Informe final", f: "assets/docs/Informe_Grupo03_Tarde.pdf", pdf: true },
    acta: { t: "Acta de constitución", f: "assets/docs/ActaConstitucion_Grupo03_Tarde.pdf" },
    edt: { t: "EDT / WBS", f: "assets/docs/EDT_Grupo03_Tarde.pdf" },
    crono: { t: "Cronograma", f: "assets/docs/Cronograma_Grupo03_Tarde.pdf", pdf: true },
  };
  function visor() {
    const frame = $("#viewer-frame");
    const pdf = (f) => `<object data="${f}#view=FitH" type="application/pdf" class="pdf"><div class="pdf-fallback"><p>Tu navegador no muestra PDF dentro de la página.</p><a class="btn btn-primary" href="${f}" target="_blank" rel="noopener">Abrir el PDF</a></div></object>`;
    const render = (k) => {
      const d = DOCS[k];
      $("#doc-title").textContent = d.t;
      $("#doc-dl").href = d.f;
      if (k === "acta") {
        frame.innerHTML = `<div class="acta"><div class="acta-thumbs">${[1, 2, 3, 4].map((n) => `<button data-n="${n}" aria-label="Hoja ${n}" ${n === 1 ? 'aria-current="true"' : ""}><img src="assets/img/acta/acta-${n}-t.jpg" alt=""><span>Hoja ${n}</span></button>`).join("")}</div>
          <div class="acta-page"><img id="acta-img" src="assets/img/acta/acta-1.jpg" alt="Acta de constitución, hoja 1 de 4"></div></div>`;
        frame.querySelector(".acta-thumbs").addEventListener("click", (e) => {
          const b = e.target.closest("button"); if (!b) return;
          $$(".acta-thumbs button", frame).forEach((o) => o.removeAttribute("aria-current"));
          b.setAttribute("aria-current", "true");
          const img = $("#acta-img"); img.src = `assets/img/acta/acta-${b.dataset.n}.jpg`; img.alt = `Acta de constitución, hoja ${b.dataset.n} de 4`;
        });
      } else if (k === "edt") {
        frame.innerHTML = `<div class="pan dark-pan"><img src="assets/img/edt.png" alt="EDT del proyecto" style="width:1800px"></div>`;
      } else {
        frame.innerHTML = pdf(d.f);
      }
    };
    const btns = $$(".viewer-tabs [role=tab]");
    btns.forEach((b) => b.addEventListener("click", () => { btns.forEach((o) => o.setAttribute("aria-selected", o === b)); render(b.dataset.doc); }));
    $("#doc-full").addEventListener("click", () => pantallaCompleta($(".viewer-body")));
    render("informe");
  }

  document.addEventListener("DOMContentLoaded", () => {
    navegacion();
    estadoProyecto();
    presentacion();
    etapas();
    planes();
    gantt();
    curvaS();
    mapaRiesgos();
    evm();
    zoom();
    visor();
    animaciones();
  });
})();
