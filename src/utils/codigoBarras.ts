// Dibujo de códigos de barras para etiquetas, sin librerías externas: EAN-13 (13 dígitos válidos) y Code 128 (cualquier otro código).

const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const EAN_PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

// Patrones de Code 128 (cada símbolo son 6 anchos alternados barra/espacio que suman 11 módulos; el de parada tiene 7).
const C128 = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];
const C128_START_B = 104;
const C128_STOP = 106;

export const digitoVerificadorEAN13 = (doce: string) => {
  let suma = 0;
  for (let i = 0; i < 12; i += 1) suma += Number(doce[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (suma % 10)) % 10;
};

export const esEAN13Valido = (codigo: string) => /^\d{13}$/.test(codigo) && digitoVerificadorEAN13(codigo.slice(0, 12)) === Number(codigo[12]);

/** Módulos del código como texto de 1 (barra) y 0 (espacio). Devuelve null si el código no se puede dibujar. */
export const modulosCodigoBarras = (codigoCrudo: string): { tipo: 'EAN-13' | 'Code 128'; modulos: string } | null => {
  const codigo = String(codigoCrudo ?? '').trim();
  if (!codigo) return null;
  if (esEAN13Valido(codigo)) {
    const paridad = EAN_PARIDAD[Number(codigo[0])];
    let m = '101';
    for (let i = 0; i < 6; i += 1) m += (paridad[i] === 'L' ? EAN_L : EAN_G)[Number(codigo[i + 1])];
    m += '01010';
    for (let i = 7; i < 13; i += 1) m += EAN_R[Number(codigo[i])];
    return { tipo: 'EAN-13', modulos: `${m}101` };
  }
  if (!/^[\x20-\x7E]+$/.test(codigo)) return null;
  const valores = [C128_START_B, ...[...codigo].map((c) => c.charCodeAt(0) - 32)];
  const control = valores.reduce((acc, v, i) => acc + v * (i === 0 ? 1 : i), 0) % 103;
  valores.push(control, C128_STOP);
  let m = '';
  valores.forEach((v) => {
    [...C128[v]].forEach((ancho, i) => { m += (i % 2 === 0 ? '1' : '0').repeat(Number(ancho)); });
  });
  return { tipo: 'Code 128', modulos: m };
};

/** SVG del código (barras negras sobre fondo blanco, con 10 módulos de margen a cada lado). */
export const svgCodigoBarras = (codigo: string, opciones: { alto?: number; modulo?: number } = {}): string => {
  const r = modulosCodigoBarras(codigo);
  if (!r) return '';
  const { alto = 40, modulo = 1 } = opciones;
  const margen = 10;
  const ancho = (r.modulos.length + margen * 2) * modulo;
  const barras: string[] = [];
  let i = 0;
  while (i < r.modulos.length) {
    if (r.modulos[i] === '1') {
      let j = i;
      while (j < r.modulos.length && r.modulos[j] === '1') j += 1;
      barras.push(`<rect x="${(margen + i) * modulo}" y="0" width="${(j - i) * modulo}" height="${alto}"/>`);
      i = j;
    } else i += 1;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="none" shape-rendering="crispEdges"><rect width="${ancho}" height="${alto}" fill="#fff"/><g fill="#000">${barras.join('')}</g></svg>`;
};
