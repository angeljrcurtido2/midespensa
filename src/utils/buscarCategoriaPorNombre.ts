import { getCategoryPaginated } from '../services/categorias';

export interface CategoriaEncontrada {
  idcategorias: number;
  categoria: string;
}

interface FilaCategoria {
  idcategorias: number;
  categoria: string | null;
}

const palabras = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

// Una lista de palabras está contenida en otra si TODAS sus palabras
// aparecen completas en la otra. Se compara por palabra entera y no por
// substring: con substring, una sugerencia "Botánica" coincidía con la
// categoría "BOTA".
const contenidas = (a: string[], b: string[]) => a.length > 0 && a.every((w) => b.includes(w));

// Busca entre las categorías del tenant una que coincida con el nombre que
// sugirió la IA al reconocer un producto ("Higiene personal", "Lubricante"...).
// Solo devuelve una si el match es claro; ante la duda, null y el usuario
// elige a mano. Nunca crea categorías.
export const buscarCategoriaPorNombre = async (nombre: string | null): Promise<CategoriaEncontrada | null> => {
  if (!nombre) return null;
  try {
    const res = await getCategoryPaginated({ page: 1, limit: 100, search: '' });
    const lista: FilaCategoria[] = Array.isArray(res.data?.data) ? res.data.data : [];
    const buscado = palabras(nombre);
    const clave = (c: FilaCategoria) => palabras(c.categoria || '');
    const exacta = lista.find((c) => clave(c).join(' ') === buscado.join(' '));
    const elegida = exacta || lista.find((c) => contenidas(clave(c), buscado) || contenidas(buscado, clave(c)));
    return elegida ? { idcategorias: elegida.idcategorias, categoria: elegida.categoria || '' } : null;
  } catch {
    return null;
  }
};
