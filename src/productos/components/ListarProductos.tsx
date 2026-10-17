import InfoFarmaciaProducto from '../../components/InfoFarmaciaProducto';
import PresentacionesProducto from '../../components/PresentacionesProducto';
import { IA_HABILITADA } from '../../config/featureFlags';
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import { useLectorCelular } from '../../hooks/useLectorCelular';
import ImagenAmpliable from '../../components/ImagenAmpliable';
import DetalleProductoFila from './DetalleProductoFila';
import { getCategoryPaginated } from '../../services/categorias';
import { PaginaListado, EncabezadoListado, BotonPrincipal, BotonSecundario, BarraFiltros, CampoBusqueda, TablaListado, AccionFila, Insignia } from '../../components/listado/Listado';
import {
  FaBoxOpen,
  FaSearch,
  FaEdit,
  FaTrash,
  FaFileAlt,
  FaBox,
  FaCheck,
  FaCamera
} from 'react-icons/fa';
import ModalEditarProducto from './ModalsProductos/ModalEditarProducto';
import ModalAdvert from '../../components/ModalAdvert';
import ModalsCrearCompraRapida from '../../compras/components/Modals/ModalsCrearCompraRapida';
import { descargarPdfBase64, fechaParaNombreArchivo } from '../../utils/descargarPdf';
import { getProductosPaginated, deleteProducto, urlImagenProducto } from '../../services/productos';
import { promoVigenteHoy } from '../../utils/promo';
import { getReportProducts } from '../../services/productos';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import { InventarioProducto } from './InventarioProducto';
import type { ReporteResponse } from '../../types/reporte.types';
import DetallesProducto from './DetallesProducto';
import { calcularStockDisponibleProducto } from '../../ventas/utils/stockCalculations';
import ButtonGrid from '../../components/ButtonGrid';
import SelectPage from '../../components/SelectPage';
import SelectPagination from '../../components/SelectPagination';
import CardText from '../../ventas/components/CobroDeudaVenta/components/CardText';
import ButtonGral from '../../components/ButtonGral';
import { ReconocimientoProducto } from './ReconocimientoProducto';
import type { ProductoCoincidente, ProductoDetectado } from '../../services/reconocimiento';
import { buscarCategoriaPorNombre } from '../../utils/buscarCategoriaPorNombre';
import type { ProductoPrecargado } from '../../compras/components/CompraRapida/FormularioProducto/FormularioProducto';

interface ListarProductosProps {
  onSelect?: (producto: any) => void;
  isBuy?: boolean;
  setCantidadProducto?: (cantidad: number) => void;
  cantidadProducto?: number;
  setCantidadMaximo?: (cantidad: number) => void;
  configVentaPorLote?: boolean;
  detalles?: any[];
  stockVerify?: boolean;
  initialSearch?: string;
  /** Pantalla propia para elegir un producto (Nueva venta / Nueva compra): mismo diseño de tabla que el listado, con el botón Seleccionar. */
  seleccionEnPagina?: boolean;
}

const ListarProductos = ({
  onSelect,
  isBuy,
  setCantidadProducto,
  cantidadProducto,
  setCantidadMaximo,
  configVentaPorLote = false,
  detalles = [],
  stockVerify = false,
  initialSearch = '',
  seleccionEnPagina = false,
}: ListarProductosProps) => {
  const [productos, setProductos] = useState<any[]>([]);
  const fetchSequence = useRef(0);
  const [modalAdvertOpen, setModalAdvertOpen] = useState(false);
  const [advertMessage, setAdvertMessage] = useState("");
  const [advertAction, setAdvertAction] = useState<(() => void) | null>(null);
  const [isInputTouched, setIsInputTouched] = useState(false);
  const [modalEditarProductoOpen, setModalEditarProductoOpen] = useState(false);
  const [idProducto, setIdProducto] = useState<number | string>('');
  const [modalCrearCompraRapidaOpen, setModalCrearCompraRapidaOpen] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  // Código escaneado con el celular: se pone en el buscador y la lista queda filtrada por ese producto.
  const centinelaVisible = useRef<HTMLSpanElement>(null);
  useLectorCelular(
    (codigo) => { setSearch(codigo); setPage(1); },
    () => (centinelaVisible.current?.getClientRects().length ?? 0) > 0,
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [datosReporte, setDatosReporte] = useState<ReporteResponse | null>(null);
  const [mostrarInventario, setMostrarInventario] = useState(false);
  const [modalDetallesOpen, setModalDetallesOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [vistaGrid, setVistaGrid] = useState(true); // true = grid, false = lista
  const [reconocimientoOpen, setReconocimientoOpen] = useState(false);
  const [productoPrecargado, setProductoPrecargado] = useState<ProductoPrecargado | null>(null);
  const [filtroFoto, setFiltroFoto] = useState<string | null>(null);
  // El listado solo trae el id de la categoría: sus nombres se piden una vez, la primera vez que se abre un detalle.
  const [nombresCategoria, setNombresCategoria] = useState<Record<number, string> | null>(null);
  const cargarNombresCategoria = async () => {
    if (nombresCategoria) return;
    try {
      const r = await getCategoryPaginated({ page: 1, limit: 1000 });
      const mapa: Record<number, string> = {};
      (r.data?.data || []).forEach((c: any) => { mapa[c.idcategorias] = c.categoria; });
      setNombresCategoria(mapa);
    } catch { setNombresCategoria({}); }
  };
  const modoPagina: boolean = !onSelect || seleccionEnPagina;
    const navigate = useNavigate();
    useAlVolverALaVentana(() => { void fetchProductos(); });


  // Estilos para CardText (con dark mode)
  const styleCardSmall = "bg-blue-50 dark:bg-gray-700 rounded-lg p-3 border border-blue-200 dark:border-gray-600";
  const styleTxtCards = "text-xs text-blue-600 dark:text-blue-300 font-medium mb-1";
  const styleTxtLabelBold = "text-xs font-bold text-blue-700 dark:text-gray-100 truncate";

  const handleGenerateReporte = async () => {
    try {
      const res = await getReportProducts();
      setDatosReporte(res.data);
      setMostrarInventario(true);
    } catch (error) {
      console.error("  Error al generar reporte del cliente:", error);
      setErrorMessage("  Error al generar el reporte");
    }
  };

  const handleDownloadPDF = () => {
    if (datosReporte?.reportePDFBase64) {
      descargarPdfBase64(
        datosReporte.reportePDFBase64,
        `Reporte-Inventario-${fechaParaNombreArchivo()}.pdf`
      );
    }
  };

  const fetchProductos = async () => {
    const sequence = ++fetchSequence.current;
    try {
      // En las pantallas de venta (se elige un producto para vender) los precios llegan con la promoción vigente.
      const res = await getProductosPaginated({ page, limit, search: search.trim(), ...(onSelect && !isBuy ? { para_venta: 1 as const } : {}) });
      // Al escanear, llegan b?squedas consecutivas. Ignoramos respuestas
      // antiguas para que no reemplacen el resultado del c?digo completo.
      if (sequence !== fetchSequence.current) return;
      const productosRecibidos = Array.isArray(res.data?.data) ? res.data.data : [];
      const codigoInicial = initialSearch.trim();
      const productosVisibles = codigoInicial
        ? productosRecibidos.filter((producto: any) =>
            String(producto.cod_barra ?? '').trim().includes(codigoInicial)
          )
        : productosRecibidos;
      setProductos(productosVisibles);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      if (sequence === fetchSequence.current) {
        console.error('Error al obtener productos:', error);
      }
    }
  };

  const handleDelete = (id: number) => {
    setAdvertMessage('¿Estás seguro de que deseas eliminar este producto?');
    setAdvertAction(() => async () => {
      try {
        await deleteProducto(id);
        setSuccessMessage('  Producto eliminado exitosamente');
        fetchProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        setErrorMessage('  No se pudo eliminar el producto');
      }
    });
    setModalAdvertOpen(true);
  };

  const handleConfirmAdvert = () => {
    if (advertAction) {
      advertAction();
    }
    setModalAdvertOpen(false);
    setAdvertAction(null);
    setAdvertMessage("");
  };

  const handleEdit = (id: number) => {
    setIdProducto(id);
    setModalEditarProductoOpen(true);
  };

  const handleDetalles = (producto: any) => {
    setProductoSeleccionado(producto);
    setModalDetallesOpen(true);
  };

  // Al elegir el producto reconocido se filtra la lista a ese producto y se
  // indica con una franja (sin modal de "encontrado" que haya que cerrar: en
  // una venta es un clic de más). La selección sigue pasando por la tarjeta
  // para no saltear la cantidad ni las validaciones de stock. Se vuelve a la
  // página 1: si no, desde la página 3 el filtro podía mostrar la lista vacía.
  const handleProductoReconocido = (producto: ProductoCoincidente) => {
    setSearch(producto.nombre_producto);
    setPage(1);
    setFiltroFoto(producto.nombre_producto);
  };

  const quitarFiltroFoto = () => {
    setSearch('');
    setPage(1);
    setFiltroFoto(null);
  };

  // Productos → Reconocer → "Crear este producto": abre "Nuevo Producto"
  // (compra rápida) con lo detectado ya cargado y la categoría existente que
  // coincida con la sugerida por la IA.
  const handleCrearDesdeFoto = async (producto: ProductoDetectado) => {
    const categoria = await buscarCategoriaPorNombre(producto.categoria_sugerida);
    setProductoPrecargado({ producto, categoria });
    setModalCrearCompraRapidaOpen(true);
  };

  // Calcular stock disponible para cada producto (stock total - lo que está en el carrito)
  const productosConStockDisponible = useMemo(() => {
    return productos.map((prod) => {
      // Si no hay detalles o es modo compra, usar stock completo
      if (!detalles || detalles.length === 0 || isBuy || configVentaPorLote) {
        return { ...prod, stockDisponible: prod.stock };
      }

      // Calcular stock disponible descontando lo que ya está en el carrito
      const stockDisponible = calcularStockDisponibleProducto(
        {
          idproducto: prod.idproducto,
          stock: prod.stock,
          unidad_medida: prod.unidad_medida,
          cant_cajas: prod.cant_cajas,
          cant_p_caja: prod.cant_p_caja,
        },
        detalles
      );

      return { ...prod, stockDisponible };
    });
  }, [productos, detalles, isBuy, configVentaPorLote]);

  const renderCantidadInput = (prod: any) => {
    const isDecimal = prod.unidad_medida === 'KG' || prod.unidad_medida === 'L';
    const min = isDecimal ? 0.1 : 1;
    const step = isDecimal ? 0.1 : 1;
    const stockDisponible = prod.stockDisponible ?? prod.stock;

    return (
      <input
        type="number"
        disabled={configVentaPorLote}
        min={min}
        step={step}
        defaultValue={min}
        onBlur={(e) => {
          let valor = isDecimal ? parseFloat(e.target.value) : parseInt(e.target.value);
          if (isNaN(valor) || valor < min) valor = min;
          // Solo validar stock si no es compra
          if (!isBuy && valor > stockDisponible) {
            setErrorMessage(`La cantidad no puede superar el stock disponible (${stockDisponible})`);
            valor = stockDisponible;
          }
          e.target.value = valor.toString();
          setCantidadProducto?.(valor);
          if (!isBuy) {
            setCantidadMaximo?.(stockDisponible);
          }
          setIsInputTouched(true);
        }}
        className="w-20 border border-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    );
  };

  const handleSeleccionar = (prod: any) => {
    const stockDisponible = prod.stockDisponible ?? prod.stock;

    // Validar stock disponible
    if (stockVerify && !isBuy && stockDisponible <= 0) {
      setErrorMessage(`  No hay stock disponible. Ya agregaste todo el stock disponible (${prod.stock}) al carrito.`);
      return;
    }

    const isDecimal = prod.unidad_medida === 'KG' || prod.unidad_medida === 'L';
    const defaultCantidad = isDecimal ? 0.1 : 1;
    const cantidadFinal = isInputTouched ? cantidadProducto ?? defaultCantidad : defaultCantidad;

    // Validar que la cantidad no exceda el stock disponible (solo para ventas, no para compras)
    if (!isBuy && cantidadFinal > stockDisponible) {
      setErrorMessage(`  Stock insuficiente. Disponible: ${stockDisponible}, intentas agregar: ${cantidadFinal}`);
      return;
    }

    setCantidadMaximo?.(stockDisponible);
    onSelect?.({ ...prod, cantidad: cantidadFinal, cantidadMaximo: stockDisponible });
  };

  // La foto se sube desde el formulario de edición: al cambiarla se recarga la lista.
  const recargarRef = useRef<() => void>(() => {});
  recargarRef.current = () => { fetchProductos(); };
  useEffect(() => {
    const alCambiar = () => recargarRef.current();
    window.addEventListener('producto:imagen', alCambiar);
    return () => window.removeEventListener('producto:imagen', alCambiar);
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [page, limit, search]);

  const getStockBadgeColor = (stock: number) => {
    if (stock <= 0) return 'bg-red-100 text-red-700 border-red-300';
    if (stock <= 10) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  if (modoPagina) {
    return (
      <PaginaListado>
        <span ref={centinelaVisible} aria-hidden="true" className="absolute h-0 w-0" />
        <EncabezadoListado
          icono={<FaBoxOpen />}
          titulo={seleccionEnPagina ? 'Seleccionar producto' : 'Productos'}
          subtitulo={seleccionEnPagina ? (isBuy ? 'Elegí el producto que vas a comprar' : 'Elegí el producto que vas a vender (solo los que tienen stock)') : 'Tu inventario: precios, stock y fotos'}
          acciones={
            <>
              {IA_HABILITADA && !seleccionEnPagina && (
                <button type="button" onClick={() => setReconocimientoOpen(true)} className="flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-white px-4 py-3 text-base font-bold text-emerald-700 hover:bg-emerald-50 dark:bg-gray-800 dark:text-emerald-300" title="Buscar producto por imagen">
                  <FaCamera aria-hidden="true" />Reconocer por foto
                </button>
              )}
              {!seleccionEnPagina && <BotonPrincipal onClick={() => navigate('/productos/nuevo')}>Nuevo producto</BotonPrincipal>}
            </>
          }
        />
        <BarraFiltros
          derecha={
            <>
              {!seleccionEnPagina && <BotonSecundario onClick={() => handleGenerateReporte()}>Reporte PDF</BotonSecundario>}
              <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
            </>
          }
        >
          <CampoBusqueda valor={search} onCambio={(v) => { setSearch(v); setPage(1); }} placeholder="Nombre, principio activo, código de barras o ubicación…" />
        </BarraFiltros>

        {filtroFoto && search === filtroFoto && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
            <FaCamera className="shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="flex-1 text-sm text-emerald-900 dark:text-emerald-200">Resultado de la foto: <span className="font-semibold">{filtroFoto}</span>.</p>
            <button type="button" onClick={quitarFiltroFoto} className="text-sm font-medium text-emerald-700 underline hover:text-emerald-900">Ver todos los productos</button>
          </div>
        )}

        <p className="mb-2 text-xs text-slate-500">Tip: hacé doble clic en un producto para ver su foto grande y todos sus datos.</p>
        <TablaListado
          filas={productos}
          claveFila={(p) => p.idproducto}
          detalleFila={(p) => {
            void cargarNombresCategoria();
            return (
              <DetalleProductoFila
                producto={p}
                categoria={p.idcategoria ? nombresCategoria?.[p.idcategoria] : undefined}
                onSeleccionar={seleccionEnPagina ? () => handleSeleccionar(p) : undefined}
                onEditar={seleccionEnPagina ? undefined : () => navigate(`/productos/editar/${p.idproducto}`)}
              />
            );
          }}
          vacio={search ? 'No se encontraron productos con ese criterio de búsqueda' : 'Todavía no hay productos registrados'}
          anchoMinimo={1000}
          columnas={[
            {
              clave: 'prod',
              titulo: 'Producto',
              render: (p) => (
                <div className="flex items-center gap-3">
                  {p.imagen ? (
                    <ImagenAmpliable src={urlImagenProducto(p.imagen)} alt={p.nombre_producto} leyenda={p.nombre_producto} tamano="h-16 w-16" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl text-slate-400" aria-hidden="true">{p.unidad_medida === 'CAJA' ? <FaBox /> : <FaBoxOpen />}</span>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{p.nombre_producto}</p>
                    <InfoFarmaciaProducto producto={p} />
                    <p className="text-xs text-slate-500">{p.unidad_medida}{p.ubicacion ? ` · ${p.ubicacion}` : ''}</p>
                    <PresentacionesProducto producto={p} />
                  </div>
                </div>
              ),
            },
            { clave: 'cod', titulo: 'Código', sinSalto: true, render: (p) => <span className="font-mono text-xs text-slate-600">{p.cod_barra || '—'}</span> },
            { clave: 'stock', titulo: 'Stock', alinear: 'right', sinSalto: true, render: (p) => <Insignia color={Number(p.stock) <= 0 ? 'rojo' : Number(p.stock) <= 10 ? 'ambar' : 'verde'}>{p.stock}</Insignia> },
            { clave: 'pc', titulo: 'P. compra', alinear: 'right', sinSalto: true, render: (p) => (p.lote_pr_compr_rec ? parseFloat(p.lote_pr_compr_rec).toLocaleString('es-PY') : '0') },
            {
              clave: 'pv',
              titulo: 'P. venta',
              alinear: 'right',
              sinSalto: true,
              render: (p) => (
                <>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{p.precio_venta ? parseFloat(p.precio_venta).toLocaleString('es-PY') : '0'}</span>
                  {(p.en_promo || promoVigenteHoy(p)) && <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">PROMO</span>}
                </>
              ),
            },
            { clave: 'iva', titulo: 'IVA', alinear: 'right', render: (p) => `${p.iva}%` },
          ]}
          acciones={(p) => seleccionEnPagina ? (
            <AccionFila icono={<FaCheck />} texto="Seleccionar" onClick={() => handleSeleccionar(p)} />
          ) : (
            <>
              <AccionFila icono={<FaEdit />} texto="Editar" onClick={() => navigate(`/productos/editar/${p.idproducto}`)} />
              <AccionFila icono={<FaFileAlt />} texto="Detalles" tipo="neutra" onClick={() => handleDetalles(p)} />
              <AccionFila icono={<FaTrash />} texto="Eliminar" tipo="peligro" onClick={() => handleDelete(p.idproducto)} />
            </>
          )}
        />

        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />

        <ModalsCrearCompraRapida
          isOpen={modalCrearCompraRapidaOpen}
          onClose={() => { setModalCrearCompraRapidaOpen(false); setProductoPrecargado(null); }}
          onSuccess={fetchProductos}
          productoInicial={productoPrecargado}
        />
        <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
        <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage("")} message={successMessage} />
        <ModalAdvert isOpen={modalAdvertOpen} onClose={() => setModalAdvertOpen(false)} message={advertMessage} onConfirm={handleConfirmAdvert} confirmButtonText="Confirmar" />
        {mostrarInventario && datosReporte && (
          <InventarioProducto reporte={datosReporte.datosReporte.reporte} onClose={() => setMostrarInventario(false)} onDownloadPDF={handleDownloadPDF} />
        )}
        {modalDetallesOpen && productoSeleccionado && (
          <DetallesProducto
            idproducto={productoSeleccionado.idproducto}
            nombre_producto={productoSeleccionado.nombre_producto}
            stockProducto={Number((productoSeleccionado as any).stock)}
            onClose={() => { setModalDetallesOpen(false); setProductoSeleccionado(null); }}
            onSuccess={() => { fetchProductos(); }}
          />
        )}
        {IA_HABILITADA && (
          <ReconocimientoProducto
            isOpen={reconocimientoOpen}
            onClose={() => setReconocimientoOpen(false)}
            onProductoSeleccionado={handleProductoReconocido}
            onCrearProducto={handleCrearDesdeFoto}
          />
        )}
      </PaginaListado>
    );
  }

  return (
    <div className="truncate min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4" style={{ scrollbarGutter: 'stable' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-2xl">
              <FaBoxOpen className="text-white text-3xl sm:text-4xl" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">Gestión de Productos</h1>
              <p className="text-sm sm:text-base text-blue-100">Administra tu inventario de forma eficiente</p>
            </div>
          </div>
        </div>

        {/* Controles superiores */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Buscador */}
            <div className="relative w-full">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filtro y botones */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Filtro de items por página y toggle vista */}
              <div className="flex items-center gap-3">
                <SelectPage limit={limit} setLimit={setLimit} setPage={setPage} />
                <ButtonGrid onClick={(isGrid) => setVistaGrid(isGrid)} vistaGrid={vistaGrid} />
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row sm:gap-3">
                <ButtonGral text='Nuevo Producto' onClick={() => setModalCrearCompraRapidaOpen(true)} />
                <ButtonGral text='Reporte PDF' onClick={()=> handleGenerateReporte()} />
                {/* type="button" en todos los botones: este componente se monta dentro
                    del <form> de Nueva Compra (vía ModalSeleccionarProducto). Sin type,
                    el default del HTML es "submit" y el click disparaba el onSubmit de
                    la compra, abriendo el modal de confirmar compra. */}
                {IA_HABILITADA && (
<button
                  type="button"
                  onClick={() => setReconocimientoOpen(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all font-semibold text-sm"
                  title="Buscar producto por imagen"
                >
                  <FaCamera />
                  <span className="hidden sm:inline">Reconocer</span>
                </button>
)}
              </div>
            </div>
          </div>
        </div>

        {/* Franja del filtro por foto: solo mientras el buscador siga mostrando
            exactamente lo que vino del reconocimiento (si el usuario escribe
            otra cosa, desaparece sola). */}
        {filtroFoto && search === filtroFoto && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <FaCamera className="hidden sm:block text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="flex-1 text-sm text-emerald-900 dark:text-emerald-200">
              Resultado de la foto: <span className="font-semibold">{filtroFoto}</span>
              {onSelect ? '. Elegí la cantidad y tocá "Seleccionar".' : '.'}
            </p>
            <button
              type="button"
              onClick={quitarFiltroFoto}
              className="self-start sm:self-auto text-sm font-medium text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900"
            >
              Ver todos los productos
            </button>
          </div>
        )}

        {/* Vista condicional: Grid o Lista */}
        <div className={vistaGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "grid grid-cols-1 gap-4"}>
          {productosConStockDisponible.map((prod) => (
            <div
              key={prod.idproducto}
              className="border-blue-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2"
            >
              {/* Header con gradiente */}
              <div className={`p-4 text-white bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-gray-700 dark:to-gray-800`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {prod.imagen ? (
                      <img src={urlImagenProducto(prod.imagen)} alt={prod.nombre_producto} className="h-12 w-12 shrink-0 rounded-lg border-2 border-white/40 object-cover" />
                    ) : (
                      <div className="bg-white/20 p-2 rounded-lg">
                        {prod.unidad_medida === 'CAJA' ? <FaBox size={20} /> : <FaBoxOpen size={20} />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate">{prod.nombre_producto}</h3>
                      <p className="text-xs opacity-90">{prod.unidad_medida}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStockBadgeColor(prod.stock)} border-2`}>
                    {!isBuy && !configVentaPorLote && detalles && detalles.length > 0 && prod.stockDisponible !== prod.stock
                      ? `Disp: ${prod.stockDisponible}`
                      : `Stock: ${prod.stock}`
                    }
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Código de barra */}
                <CardText
                  title="Código de Barra"
                  text={prod.cod_barra || 'N/A'}
                  containerClass={styleCardSmall}
                  titleClass={styleTxtCards}
                  textClass={styleTxtLabelBold}
                />

                {/* Precios */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">P. Compra</p>
                    <p className="font-bold text-blue-900 dark:text-gray-100 text-sm">
                      ₲ {prod.lote_pr_compr_rec ? parseFloat(prod.lote_pr_compr_rec).toLocaleString("es-PY") : '0'}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">P. Venta{(prod.en_promo || promoVigenteHoy(prod)) && <span className="ml-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">PROMO</span>}</p>
                    <p className="font-bold text-blue-900 dark:text-gray-100 text-sm">
                      ₲ {prod.precio_venta ? parseFloat(prod.precio_venta).toLocaleString("es-PY") : '0'}
                    </p>
                    {prod.en_promo && (prod.promo_unidad || prod.promo_caja || prod.promo_pack) ? (
                      <div className="mt-0.5 whitespace-normal break-words text-[11px] font-semibold leading-tight text-rose-600">
                        {[['unid.', prod.promo_unidad], ['caja', prod.promo_caja], ['pack', prod.promo_pack]].filter(([, v]) => v).map(([n, v]) => (
                          <div key={n as string}>Promo {n} ₲ {Number(v).toLocaleString('es-PY')}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Ubicación e IVA */}
                <div className="grid grid-cols-2 gap-2">
                  <CardText
                    title="Ubicación"
                    text={prod.ubicacion}
                    containerClass={styleCardSmall}
                    titleClass={styleTxtCards}
                    textClass={styleTxtLabelBold}
                  />
                  <CardText
                    title="IVA"
                    text={`${prod.iva}%`}
                    containerClass={styleCardSmall}
                    titleClass={styleTxtCards}
                    textClass={styleTxtLabelBold}
                  />
                </div>

                {/* Info de CAJA */}
                {prod.unidad_medida === 'CAJA' && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-orange-200 dark:border-gray-600">
                    <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-orange-700 dark:text-orange-300">Cajas</p>
                      <p className="font-bold text-orange-900 dark:text-gray-100">{prod.cant_cajas || 'N/A'}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-orange-700 dark:text-orange-300">P. Caja</p>
                      <p className="font-bold text-orange-900 dark:text-gray-100 text-xs truncate">
                        {prod.precio_compra_caja ? `₲ ${parseFloat(prod.precio_compra_caja).toLocaleString("es-PY")}` : "N/A"}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-orange-700 dark:text-orange-300">Unid/Caja</p>
                      <p className="font-bold text-orange-900 dark:text-gray-100">{prod.cant_p_caja ?? "N/A"}</p>
                    </div>
                  </div>
                )}

                {/* Stock disponible vs total */}
                {!isBuy && !configVentaPorLote && detalles && detalles.length > 0 && prod.stockDisponible !== prod.stock && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">Stock total: <span className="font-bold">{prod.stock}</span></p>
                  </div>
                )}

                {/* Acciones */}
                <div className="pt-3 border-t border-blue-100 dark:border-gray-600">
                  {onSelect ? (
                    <div className="space-y-2">
                      {setCantidadProducto && (
                        <div className="flex justify-center">
                          {renderCantidadInput(prod)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSeleccionar(prod)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <FaCheck />
                        Seleccionar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(prod.idproducto)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                        title="Editar"
                      >
                        <FaEdit />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDetalles(prod)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-lg"
                        title="Detalles"
                      >
                        <FaFileAlt />
                        Detalles
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod.idproducto)}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación mejorada */}
        <SelectPagination setPage={setPage} page={page} totalPages={totalPages} />
      </div>

      {/* Modales */}
      <ModalsCrearCompraRapida
        isOpen={modalCrearCompraRapidaOpen}
        onClose={() => { setModalCrearCompraRapidaOpen(false); setProductoPrecargado(null); }}
        onSuccess={fetchProductos}
        productoInicial={productoPrecargado}
      />
      <ModalEditarProducto isOpen={modalEditarProductoOpen} onClose={() => setModalEditarProductoOpen(false)} onSuccess={fetchProductos} id={idProducto} />
      <ModalError isOpen={!!errorMessage} onClose={() => setErrorMessage("")} message={errorMessage} />
      <ModalSuccess isOpen={!!successMessage} onClose={() => setSuccessMessage("")} message={successMessage} />
      <ModalAdvert
        isOpen={modalAdvertOpen}
        onClose={() => setModalAdvertOpen(false)}
        message={advertMessage}
        onConfirm={handleConfirmAdvert}
        confirmButtonText="Confirmar"
      />

      {/* Modal de Inventario */}
      {mostrarInventario && datosReporte && (
        <InventarioProducto
          reporte={datosReporte.datosReporte.reporte}
          onClose={() => setMostrarInventario(false)}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Modal Detalles Producto */}
      {modalDetallesOpen && productoSeleccionado && (
        <DetallesProducto
          idproducto={productoSeleccionado.idproducto}
          nombre_producto={productoSeleccionado.nombre_producto}
          stockProducto={Number((productoSeleccionado as any).stock)}
          onClose={() => {
            setModalDetallesOpen(false);
            setProductoSeleccionado(null);
          }}
          onSuccess={() => {
            fetchProductos();
          }}
        />
      )}

      {/* Modal de Reconocimiento de Producto.
          "Crear este producto" solo en la pantalla de Productos: cuando esta
          lista se usa para elegir un producto dentro de Nueva Compra (onSelect),
          abrir una compra rápida aparte en medio de otra compra confunde; ahí
          se usa "Crear producto" del propio formulario de compra. */}
      {IA_HABILITADA && (
<ReconocimientoProducto
        isOpen={reconocimientoOpen}
        onClose={() => setReconocimientoOpen(false)}
        onProductoSeleccionado={handleProductoReconocido}
        onCrearProducto={onSelect ? undefined : handleCrearDesdeFoto}
      />
)}
    </div>
  );
};

export default ListarProductos;
