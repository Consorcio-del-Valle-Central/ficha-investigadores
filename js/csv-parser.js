export function parseCSV(csvText) {
  const text = String(csvText).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closed = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closed = true;
      } else {
        field += char;
      }
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field);
      field = '';
      closed = false;
      if (char !== ',') {
        if (row.some(value => value !== '')) rows.push(row);
        row = [];
        if (char === '\r' && text[i + 1] === '\n') i++;
      }
    } else if (char === '"' && field === '' && !closed) {
      quoted = true;
    } else if (char === '"' || closed) {
      throw new Error(`CSV inválido cerca del carácter ${i + 1}`);
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('CSV inválido: comillas sin cerrar');
  if (row.length || field !== '' || closed) {
    row.push(field);
    if (row.some(value => value !== '')) rows.push(row);
  }
  if (!rows.length) throw new Error('El CSV está vacío');

  const [headers, ...records] = rows;
  return records.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`Fila CSV ${index + 2}: ${values.length} columnas; se esperaban ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}