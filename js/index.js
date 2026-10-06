import { parseCSV } from './csv-parser.js';

const estado = document.getElementById('estado');
const lista = document.getElementById('investigadores');
const plantilla = document.getElementById('plantilla-investigador');

function obtenerColumnas(headers) {
  const columnas = new Map();

  for (const header of headers) {
    const match = header.replace(/^\uFEFF/, '').trim().match(/^(\d+)\s*\./);
    if (!match) continue;

    const numero = Number(match[1]);
    if (columnas.has(numero)) {
      throw new Error(`Encabezado duplicado: ${numero}`);
    }
    columnas.set(numero, header);
  }

  for (const numero of [1, 2, 3, 4, 9]) {
    if (!columnas.has(numero)) {
      throw new Error(`Falta la pregunta ${numero} en el CSV`);
    }
  }

  if (!headers.includes('ID')) {
    throw new Error('El CSV no tiene una columna llamada "ID"');
  }

  return columnas;
}

function completarTexto(elemento, texto) {
  if (texto) {
    elemento.textContent = texto;
  } else {
    elemento.hidden = true;
  }
}

function crearElemento(investigador) {
  const elemento = plantilla.content.firstElementChild.cloneNode(true);
  const enlace = elemento.querySelector('.investigador-enlace');
  enlace.href = `./detalle/?id=${encodeURIComponent(investigador.id)}`;
  elemento.querySelector('.investigador-nombre').textContent = investigador.nombre;

  completarTexto(
    elemento.querySelector('.investigador-institucion'),
    investigador.universidad,
  );
  completarTexto(
    elemento.querySelector('.investigador-facultad'),
    investigador.facultad,
  );
  completarTexto(
    elemento.querySelector('.investigador-disciplinas'),
    investigador.disciplinas,
  );

  return elemento;
}

async function iniciar() {
  try {
    const response = await fetch('./assets/researchers-list.csv');
    if (!response.ok) {
      throw new Error(`No se pudo cargar el CSV (HTTP ${response.status})`);
    }

    const filas = parseCSV(await response.text());
    const headers = Object.keys(filas[0] ?? {});
    const columnas = obtenerColumnas(headers);
    const ids = new Set();
    const investigadores = filas.map((fila, indice) => {
      const investigador = {
        id: (fila.ID ?? '').trim(),
        nombre: (fila[columnas.get(1)] ?? '').trim(),
        universidad: (fila[columnas.get(3)] ?? '').trim(),
        facultad: (fila[columnas.get(4)] ?? '').trim(),
        disciplinas: (fila[columnas.get(9)] ?? '').trim(),
      };

      if (!investigador.id || !investigador.nombre) {
        throw new Error(`Falta el ID o el nombre en la fila ${indice + 2} del CSV`);
      }
      if (ids.has(investigador.id)) {
        throw new Error(`El ID "${investigador.id}" aparece más de una vez en el CSV`);
      }
      ids.add(investigador.id);
      return investigador;
    });

    const fragmento = document.createDocumentFragment();
    for (const investigador of investigadores) {
      fragmento.append(crearElemento(investigador));
    }
    lista.append(fragmento);
    lista.hidden = false;
    estado.textContent = `${investigadores.length} investigadores`;
  } catch (error) {
    console.error(error);
    estado.textContent = `No se pudo cargar el directorio: ${error.message}`;
  }
}

iniciar();
