const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRKRecW1uyz8IDeqjkBaM6-Zf7uAIe2W4H9HMctptD2tkYQn2E7AbiA4spGYEyNR_r-uxQ-Dw1kHD3n/pub?output=csv';

let aprendices = [];
let filtroTexto = '';
let filtroPrograma = 'Todos';
let filtroTech = 'Todas';
let vistaActual = 'lista';
let idSeleccionado = null;

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && next === '\n') i++;
        row.push(field); field = ''; rows.push(row); row = [];
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function splitMulti(v) { return (v || '').split('|').map(s => s.trim()).filter(Boolean); }

function rowsToAprendices(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map((r, idx) => {
    const g = (name) => { const i = headers.indexOf(name); return i === -1 ? '' : (r[i] || '').trim(); };
    const nombre = g('nombre');
    const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const proyectos = [];
    for (const n of [1, 2, 3]) {
      const titulo = g('proyecto' + n + '_titulo');
      if (titulo) {
        proyectos.push({
          titulo,
          descripcion: g('proyecto' + n + '_descripcion'),
          tecnologias: splitMulti(g('proyecto' + n + '_tecnologias')),
          link: g('proyecto' + n + '_link'),
          fecha: g('proyecto' + n + '_fecha')
        });
      }
    }
    return {
      id: idx + 1,
      nombre, iniciales,
      foto: g('foto_url') || null,
      ficha: g('ficha'),
      programa: g('programa'),
      bio: g('bio'),
      tecnologias: splitMulti(g('tecnologias')),
      links: { github: g('github') || null, linkedin: g('linkedin') || null, portfolio: g('portfolio') || null },
      certificaciones: splitMulti(g('certificaciones')),
      proyectos
    };
  }).filter(a => a.nombre);
}

function aplicarAvatar(el, foto, iniciales) {
  el.style.backgroundImage = 'none';
  el.style.color = 'var(--azul)';
  el.textContent = iniciales;
  if (!foto) return;
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url("${foto}")`;
    el.style.color = 'transparent';
    el.textContent = '';
  };
  img.src = foto;
}

function poblarSelect(select, valores, actual) {
  select.innerHTML = '';
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    if (v === actual) opt.selected = true;
    select.appendChild(opt);
  });
}

function aprendicesFiltrados() {
  const q = filtroTexto.trim().toLowerCase();
  return aprendices.filter(a => {
    const matchQ = !q || a.nombre.toLowerCase().includes(q);
    const matchP = filtroPrograma === 'Todos' || a.programa === filtroPrograma;
    const matchT = filtroTech === 'Todas' || a.tecnologias.includes(filtroTech);
    return matchQ && matchP && matchT;
  });
}

function renderLista() {
  const filtrados = aprendicesFiltrados();
  document.getElementById('contador').textContent = `${filtrados.length} aprendices encontrados`;
  const grid = document.getElementById('grid-aprendices');
  grid.innerHTML = '';
  filtrados.forEach(a => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="#" class="tarjeta" data-id="${a.id}">
        <div class="tarjeta-header">
          <div class="avatar avatar-lista" data-avatar></div>
          <p class="tarjeta-nombre">${a.nombre}</p>
          <p class="tarjeta-programa">${a.programa}</p>
          <p class="tarjeta-ficha">Ficha ${a.ficha}</p>
        </div>
        <div class="tarjeta-body">
          <ul class="tags">${a.tecnologias.slice(0, 3).map(t => `<li class="tag">${t}</li>`).join('')}</ul>
          <p class="ver-perfil">Ver perfil →</p>
        </div>
      </a>`;
    aplicarAvatar(li.querySelector('[data-avatar]'), a.foto, a.iniciales);
    li.querySelector('.tarjeta').addEventListener('click', (e) => {
      e.preventDefault();
      idSeleccionado = a.id;
      vistaActual = 'perfil';
      render();
    });
    grid.appendChild(li);
  });
}

function renderPerfil() {
  const a = aprendices.find(x => x.id === idSeleccionado) || aprendices[0];
  if (!a) return;
  aplicarAvatar(document.getElementById('perfil-avatar'), a.foto, a.iniciales);
  document.getElementById('perfil-nombre').textContent = a.nombre;
  document.getElementById('perfil-meta').textContent = `${a.programa} · Ficha ${a.ficha}`;
  document.getElementById('perfil-bio').textContent = a.bio;

  const links = document.getElementById('perfil-links');
  links.innerHTML = '';
  if (a.links.github) links.innerHTML += `<a class="link-btn" href="${a.links.github}" target="_blank" rel="noopener">GitHub</a>`;
  if (a.links.linkedin) links.innerHTML += `<a class="link-btn" href="${a.links.linkedin}" target="_blank" rel="noopener">LinkedIn</a>`;
  if (a.links.portfolio) links.innerHTML += `<a class="link-btn primario" href="${a.links.portfolio}" target="_blank" rel="noopener">Portafolio</a>`;

  document.getElementById('perfil-tech').innerHTML = a.tecnologias.map(t => `<li class="tag-tech">${t}</li>`).join('');
  document.getElementById('perfil-certs').innerHTML = a.certificaciones.map(c => `<li><span class="cert-dot"></span>${c}</li>`).join('');

  document.getElementById('perfil-proyectos').innerHTML = a.proyectos.map(p => `
    <li class="proyecto-card">
      <div class="proyecto-thumb"><span>captura del proyecto</span></div>
      <div class="proyecto-body">
        <p class="proyecto-titulo">${p.titulo}</p>
        <p class="proyecto-desc">${p.descripcion}</p>
        <ul class="proyecto-tags">${p.tecnologias.map(t => `<li class="proyecto-tag">${t}</li>`).join('')}</ul>
        <div class="proyecto-footer">
          <span class="proyecto-fecha">${p.fecha}</span>
          <a class="proyecto-link" href="${p.link}" target="_blank" rel="noopener">Ver repositorio →</a>
        </div>
      </div>
    </li>`).join('');
}

function render() {
  document.getElementById('vista-lista').hidden = vistaActual !== 'lista';
  document.getElementById('vista-perfil').hidden = vistaActual !== 'perfil';
  if (vistaActual === 'lista') renderLista(); else renderPerfil();
}

function mostrarEstado(estado) {
  document.getElementById('estado-carga').hidden = estado !== 'carga';
  document.getElementById('estado-error').hidden = estado !== 'error';
  document.getElementById('estado-vacio').hidden = estado !== 'vacio';
  const listaOk = estado === 'ok';
  document.getElementById('vista-lista').hidden = !(listaOk && vistaActual === 'lista');
  document.getElementById('vista-perfil').hidden = !(listaOk && vistaActual === 'perfil');
}

function cargarDatos() {
  mostrarEstado('carga');
  fetch(SHEET_CSV_URL)
    .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.text(); })
    .then(text => {
      aprendices = rowsToAprendices(parseCSV(text));
      if (!aprendices.length) { mostrarEstado('vacio'); return; }
      const programas = ['Todos', ...new Set(aprendices.map(a => a.programa).filter(Boolean))];
      const techs = ['Todas', ...new Set(aprendices.flatMap(a => a.tecnologias))];
      poblarSelect(document.getElementById('filtro-programa'), programas, filtroPrograma);
      poblarSelect(document.getElementById('filtro-tech'), techs, filtroTech);
      mostrarEstado('ok');
      render();
    })
    .catch(() => mostrarEstado('error'));
}

document.getElementById('search').addEventListener('input', (e) => { filtroTexto = e.target.value; renderLista(); });
document.getElementById('filtro-programa').addEventListener('change', (e) => { filtroPrograma = e.target.value; renderLista(); });
document.getElementById('filtro-tech').addEventListener('change', (e) => { filtroTech = e.target.value; renderLista(); });
document.getElementById('reset-filtros').addEventListener('click', () => {
  filtroTexto = ''; filtroPrograma = 'Todos'; filtroTech = 'Todas';
  document.getElementById('search').value = '';
  document.getElementById('filtro-programa').value = 'Todos';
  document.getElementById('filtro-tech').value = 'Todas';
  renderLista();
});
document.getElementById('volver').addEventListener('click', () => { vistaActual = 'lista'; render(); });

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
toggleBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  toggleBtn.classList.toggle('collapsed');
  toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
});

cargarDatos();