'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTag, FaEdit, FaTrash, FaCheck, FaPlus, FaTimes } from 'react-icons/fa';
import { getCategoryPaginated, deleteCategory, createCategory, updateCategory } from '../../services/categorias';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BarraFiltros, CampoBusqueda, TablaListado, AccionFila } from '../../components/listado/Listado';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import ModalAdvert from '../../components/ModalAdvert';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';

interface ListarCategoriasProps {
  /** Si viene, la lista se usa para ELEGIR una categoría (por ejemplo al crear un producto) y además permite crear, editar y eliminar ahí mismo. */
  onSelect?: (categoria: any) => void;
}

const mensajeDe = (e: any, predeterminado: string) => e?.response?.data?.error || e?.response?.data?.message || predeterminado;

export default function ListarCategorias({ onSelect }: ListarCategoriasProps) {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<number | null>(null);

  // Gestión dentro del selector (sin ventanas encima de la ventana: todo se hace en la misma tabla).
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await getCategoryPaginated({ page, limit, search });
      setCategorias(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener categorias:', error);
      setErrorMessage('No se pudieron cargar las categorias');
    } finally {
      setLoading(false);
    }
  };

  useAlVolverALaVentana(() => { void fetchCategorias(); });

  useEffect(() => {
    void fetchCategorias();
  }, [page, limit, search]);

  const confirmarEliminacion = async () => {
    if (categoriaAEliminar === null) return;
    try {
      await deleteCategory(categoriaAEliminar);
      setSuccessMessage('Categoria eliminada correctamente');
      void fetchCategorias();
    } catch (e) {
      setErrorMessage(mensajeDe(e, 'No se pudo eliminar la categoria'));
    } finally {
      setModalAdvertOpen(false);
      setCategoriaAEliminar(null);
    }
  };

  const crearYElegir = async (e: React.FormEvent) => {
    e.preventDefault();
    // Este selector se muestra dentro del formulario de la compra: sin esto, el envío "subía" por el árbol de React y abría la confirmación de la compra.
    e.stopPropagation();
    const nombre = nuevoNombre.trim();
    if (!nombre) { setAviso({ tipo: 'error', texto: 'Escribí el nombre de la categoría.' }); return; }
    setGuardando(true);
    setAviso(null);
    try {
      const r = await createCategory({ categoria: nombre, estado: 'activo' });
      setNuevoNombre('');
      onSelect?.({ idcategorias: r.data?.id, categoria: nombre, estado: 'activo' });
    } catch (err: any) {
      // Si ya existía con ese nombre, se ofrece usarla en lugar de duplicarla.
      const ya = err?.response?.status === 409 ? err.response.data : null;
      setAviso({ tipo: 'error', texto: mensajeDe(err, 'No se pudo crear la categoría.') });
      if (ya?.idcategorias) setSearch(nombre);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async (categoria: any) => {
    const nombre = editandoNombre.trim();
    if (!nombre) { setAviso({ tipo: 'error', texto: 'El nombre no puede quedar vacío.' }); return; }
    setGuardando(true);
    setAviso(null);
    try {
      await updateCategory(categoria.idcategorias, { categoria: nombre, estado: categoria.estado || 'activo' });
      setEditandoId(null);
      setAviso({ tipo: 'ok', texto: `Categoría renombrada a "${nombre}".` });
      void fetchCategorias();
    } catch (err) {
      setAviso({ tipo: 'error', texto: mensajeDe(err, 'No se pudo guardar el cambio.') });
    } finally {
      setGuardando(false);
    }
  };

  const eliminarAhi = async (categoria: any) => {
    setGuardando(true);
    setAviso(null);
    try {
      await deleteCategory(categoria.idcategorias);
      setConfirmandoId(null);
      setAviso({ tipo: 'ok', texto: `Se eliminó la categoría "${categoria.categoria}".` });
      void fetchCategorias();
    } catch (err) {
      setConfirmandoId(null);
      setAviso({ tipo: 'error', texto: mensajeDe(err, 'No se pudo eliminar la categoría.') });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PaginaListado>
      <EncabezadoListado
        icono={<FaTag />}
        titulo={onSelect ? 'Seleccionar categoria' : 'Categorias'}
        subtitulo={onSelect ? 'Elegí una, o creá una nueva para este producto' : 'Administra las categorias de productos'}
        acciones={!onSelect ? <BotonPrincipal color="azul" onClick={() => navigate('/categoria/nueva')}>Nueva categoria</BotonPrincipal> : undefined}
      />

      {onSelect && (
        <form onSubmit={crearYElegir} className="mb-3 flex flex-wrap items-end gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <label className="min-w-[220px] flex-1 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            ¿No está la categoría? Creala acá
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              maxLength={100}
              placeholder="Nombre de la categoría nueva"
              className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-base font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <button type="submit" disabled={guardando} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-gray-300">
            <FaPlus aria-hidden="true" /> Crear y elegir
          </button>
        </form>
      )}
      {onSelect && aviso && (
        <p role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`mb-3 rounded-lg px-4 py-2 text-sm font-semibold ${aviso.tipo === 'error' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
          {aviso.texto}
        </p>
      )}

      <BarraFiltros derecha={<SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />}>
        <CampoBusqueda valor={search} onCambio={(valor) => { setSearch(valor); setPage(1); }} placeholder="Buscar por nombre de categoria..." />
      </BarraFiltros>
      <TablaListado
        filas={categorias}
        claveFila={(categoria) => categoria.idcategorias}
        cargando={loading}
        vacio={search ? 'No se encontraron categorias con esa busqueda' : 'No hay categorias registradas'}
        anchoMinimo={650}
        columnas={[
          {
            clave: 'categoria',
            titulo: 'Categoria',
            render: (categoria) => onSelect && editandoId === categoria.idcategorias ? (
              <input
                autoFocus
                value={editandoNombre}
                onChange={(e) => setEditandoNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void guardarEdicion(categoria); } else if (e.key === 'Escape') setEditandoId(null); }}
                maxLength={100}
                aria-label="Nuevo nombre de la categoría"
                className="w-full rounded-lg border-2 border-blue-400 px-3 py-1.5 font-bold text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
              />
            ) : <span className="font-bold text-slate-900 dark:text-slate-100">{categoria.categoria}</span>,
          },
          { clave: 'estado', titulo: 'Estado', render: (categoria) => <span className="capitalize">{categoria.estado || 'Activa'}</span> },
        ]}
        acciones={(categoria) => onSelect ? (
          editandoId === categoria.idcategorias ? (
            <>
              <AccionFila icono={<FaCheck />} texto="Guardar" onClick={() => void guardarEdicion(categoria)} />
              <AccionFila icono={<FaTimes />} texto="Cancelar" tipo="neutra" onClick={() => setEditandoId(null)} />
            </>
          ) : confirmandoId === categoria.idcategorias ? (
            <>
              <span className="self-center text-sm font-semibold text-rose-700">¿Eliminarla?</span>
              <AccionFila icono={<FaTrash />} texto="Sí, eliminar" tipo="peligro" onClick={() => void eliminarAhi(categoria)} />
              <AccionFila icono={<FaTimes />} texto="No" tipo="neutra" onClick={() => setConfirmandoId(null)} />
            </>
          ) : (
            <>
              <AccionFila icono={<FaCheck />} texto="Seleccionar" onClick={() => onSelect(categoria)} />
              <AccionFila icono={<FaEdit />} texto="Editar" tipo="neutra" onClick={() => { setAviso(null); setConfirmandoId(null); setEditandoId(categoria.idcategorias); setEditandoNombre(categoria.categoria || ''); }} />
              <AccionFila icono={<FaTrash />} texto="Eliminar" tipo="peligro" onClick={() => { setAviso(null); setEditandoId(null); setConfirmandoId(categoria.idcategorias); }} />
            </>
          )
        ) : (
          <>
            <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/categoria/editar/${categoria.idcategorias}`)} />
            <AccionFila icono={<FaTrash />} texto="Eliminar" tipo="peligro" onClick={() => { setCategoriaAEliminar(categoria.idcategorias); setModalAdvertOpen(true); }} />
          </>
        )}
      />
      <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      <ModalAdvert
        isOpen={modalAdvertOpen}
        onClose={() => setModalAdvertOpen(false)}
        onConfirm={confirmarEliminacion}
        message="Estas seguro de que deseas eliminar esta categoria?"
        confirmButtonText="Eliminar"
      />
      <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage('')} message={successMessage} />
      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage('')} message={errorMessage} />
    </PaginaListado>
  );
}
