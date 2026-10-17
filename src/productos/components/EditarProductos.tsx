'use client';

import AjusteStock from './AjusteStock';
import BotonGenerarCodigoBarra from '../../components/BotonGenerarCodigoBarra';
import ModalEtiquetas from '../../components/ModalEtiquetas';
import { useEffect, useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import ModalSeleccionarCategoria from '../components/ModalsProductos/ModalSeleccionarCategoria';
import ModalConfirmUpdate from './ModalsProductos/ModalConfirmUpdate';
import { FiSave } from 'react-icons/fi';
import { getProductoById, updateProducto } from '../../services/productos';
import DatosFarmaciaProducto from '../../components/DatosFarmaciaProducto';
import { NumericFormat } from 'react-number-format';
import { ChevronDown, Package } from 'lucide-react';
import ImagenProducto from './ImagenProducto';
import AyudaPrecioUnidad from '../../components/AyudaPrecioUnidad';

const initialForm = {
  nombre_producto: '',
  precio_venta: '',
  precio_venta_caja: '',
  precio_venta_pack: '',
  precio_compra: '',
  precio_compra_caja: '',
  idcategoria: '',
  ubicacion: '',
  principio_activo: '',
  laboratorio: '',
  receta: 'libre',
  stock_minimo: '',
  cod_barra: '',
  iva: '',
  estado: 'activo',
  unidad_medida: '',
  cant_p_caja: '',
  cant_p_pack: '',
  cant_cajas: '',
  oferta_cantidad: '',
  oferta_precio: ''
};

interface EditarProductoProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const EditarProducto = ({ id, onSuccess, onClose }: EditarProductoProps) => {
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [etiquetasAbierto, setEtiquetasAbierto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [esInventarioInicial, setEsInventarioInicial] = useState(false);
  const [stockActual, setStockActual] = useState<number | null>(null);
  const [mostrarSugerenciaScroll, setMostrarSugerenciaScroll] = useState(false);

  useEffect(() => {
    if (id) {
      getProductoById(id).then((res) => {
        const data = res.data;

        // Normalizar IVA: convertir "10.00" a "10", "5.00" a "5", etc.
        const normalizarIva = (iva: any): string => {
          if (iva === null || iva === undefined || iva === '') return '';
          const ivaNum = parseFloat(iva);
          if (isNaN(ivaNum)) return '';
          return String(Math.round(ivaNum));
        };

        setFormData({
          nombre_producto: data.nombre_producto || '',
          precio_venta: data.precio_venta ?? '',
          precio_venta_caja: data.precio_venta_caja ?? '',
          precio_venta_pack: data.precio_venta_pack ?? '',
          precio_compra: data.precio_compra ?? '',
          precio_compra_caja: data.precio_compra_caja ?? '',
          idcategoria: data.idcategoria ?? '',
          ubicacion: data.ubicacion || '',
          principio_activo: data.principio_activo || '',
          laboratorio: data.laboratorio || '',
          receta: data.receta || 'libre',
          stock_minimo: data.stock_minimo === null || data.stock_minimo === undefined ? '' : String(data.stock_minimo),
          cod_barra: data.cod_barra || '',
          iva: normalizarIva(data.iva),
          estado: data.estado || 'activo',
          unidad_medida: data.unidad_medida || '',
          cant_p_caja: data.cant_p_caja ?? '',
          cant_p_pack: data.cant_p_pack ?? '',
          cant_cajas: data.cant_cajas ?? '',
          oferta_cantidad: data.oferta_cantidad ?? '',
          oferta_precio: data.oferta_precio ?? ''
        });
        setCategoriaNombre(data.nombre_categoria || '');
        setStockActual(data.stock === null || data.stock === undefined ? null : Number(data.stock));

        // Detectar si es inventario inicial (tiene precio_compra establecido)
        setEsInventarioInicial(data.precio_compra !== null && data.precio_compra !== undefined && data.precio_compra !== '');
      });
    }
  }, [id]);

  useEffect(() => {
    const actualizarSugerencia = () => {
      const scroller = document.scrollingElement;
      if (!scroller) return;
      const quedaContenido = scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 24;
      setMostrarSugerenciaScroll(quedaContenido);
    };

    actualizarSugerencia();
    window.addEventListener('scroll', actualizarSugerencia, { passive: true });
    window.addEventListener('resize', actualizarSugerencia);
    const observador = new ResizeObserver(actualizarSugerencia);
    observador.observe(document.body);
    return () => {
      window.removeEventListener('scroll', actualizarSugerencia);
      window.removeEventListener('resize', actualizarSugerencia);
      observador.disconnect();
    };
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let formActualizado = { ...formData, [name]: value };

    // Limpiar campos específicos de cajas cuando no sea CAJA
    if (name === 'unidad_medida' && value !== 'CAJA') {
      formActualizado = {
        ...formActualizado,
        cant_cajas: '',
        cant_p_caja: '',
        precio_venta_caja: '',
        precio_compra_caja: ''
      };
    }

    setFormData(formActualizado);
  };

  const handleNumericChange = (field: string, value: string) => {
    const formActualizado = { ...formData, [field]: value };

    // Calcular precio_venta_caja automáticamente si es CAJA
    if (false && formData.unidad_medida === 'CAJA') {
      const porCaja = parseFloat(formActualizado.cant_p_caja) || 0;
      const precioVentaUnitario = parseFloat(formActualizado.precio_venta) || 0;

      if (field === 'precio_venta' && precioVentaUnitario > 0 && porCaja > 0) {
        formActualizado.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
      } else if (field === 'precio_venta_caja') {
        const precioVentaCaja = parseFloat(value) || 0;
        if (precioVentaCaja > 0 && porCaja > 0) {
          formActualizado.precio_venta = (precioVentaCaja / porCaja).toFixed(4);
        }
      } else if (field === 'cant_p_caja' && porCaja > 0 && precioVentaUnitario > 0) {
        formActualizado.precio_venta_caja = (precioVentaUnitario * porCaja).toFixed(2);
      }
    }

    setFormData(formActualizado);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmModalOpen(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      await updateProducto(id, formData);
      setConfirmModalOpen(false);
      setSuccessModalOpen(true);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error('Error al actualizar producto:', error.response?.data?.message);
      setErrorMessage(error.response?.data?.message || 'Error al actualizar producto');
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose && onClose();
  };

  // Estilos reutilizables con responsive
  const styleInput = `
  w-full
  bg-white dark:bg-slate-800
  border-2 border-slate-200 dark:border-slate-700
  rounded-xl
  px-3 py-2 sm:px-4 sm:py-3 md:px-4 md:py-3
  text-xs sm:text-sm md:text-sm font-medium
  text-slate-700 dark:text-slate-100
  placeholder-slate-400 dark:placeholder-slate-500
  focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800
  focus:border-blue-500 dark:focus:border-blue-400
  transition-all shadow-sm hover:shadow-md
`;

  const styleLabel = `
  block text-xs sm:text-sm md:text-sm
  font-semibold
  text-slate-700 dark:text-slate-200
  mb-1 sm:mb-2 md:mb-2
`;

  const styleSection = `
  bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900
  rounded-xl
  p-3 sm:p-4 md:p-4
  border border-blue-100 dark:border-slate-700
`;

  const styleSectionGreen = `
  bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-800 dark:to-slate-900
  rounded-xl
  p-3 sm:p-4 md:p-4
  border border-emerald-200 dark:border-emerald-700
`;

  const styleStepBadge = `
  bg-blue-500 text-white rounded-lg px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold shadow-md
`;

  const styleStepBadgeGreen = `
  bg-emerald-500 text-white rounded-lg px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-bold shadow-md
`;

  const etiquetaPrecioBase = (() => {
    switch (formData.unidad_medida) {
      case 'CAJA': return 'Precio de venta por unidad suelta';
      case 'KG': return 'Precio de venta por kilogramo';
      case 'LITRO': return 'Precio de venta por litro';
      case 'PAQUETE': return 'Precio de venta por paquete';
      case 'UNIDAD': return 'Precio de venta por unidad';
      default: return 'Precio de venta';
    }
  })();

  const ayudaPrecioBase = formData.unidad_medida === 'CAJA'
    ? 'Este importe corresponde a una unidad suelta. El precio de la caja se configura por separado.'
    : formData.unidad_medida === 'UNIDAD'
      ? 'Este importe corresponde a 1 unidad. Si solo vendes unidades sueltas, no necesitas configurar packs.'
      : '';

  return (
    <div className="min-h-[calc(100vh-180px)] w-full bg-slate-50 p-3 sm:p-5 lg:p-6 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-none space-y-4">
        <header className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"><Package size={21} /></span>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-slate-900 dark:text-white">Editar producto</h2><p className="mt-0.5 text-sm text-slate-500">Actualizá la información, presentación y precios del producto.</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${formData.estado === 'activo' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{formData.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
        </header>

        <AjusteStock id={id} stockActual={stockActual} unidad={formData.unidad_medida} porCaja={formData.cant_p_caja} porPack={formData.cant_p_pack} onActualizado={setStockActual} />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="sticky top-16 z-20 flex justify-end pr-4 pointer-events-none">
            <button
              type="button"
              onClick={() => document.getElementById('editar-producto-mas-campos')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              aria-label="Bajar para ver más campos que completar"
              aria-hidden={!mostrarSugerenciaScroll}
              tabIndex={mostrarSugerenciaScroll ? 0 : -1}
              className={`pointer-events-auto inline-flex origin-bottom-right items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 shadow-md transition-all duration-300 ease-out hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800 ${mostrarSugerenciaScroll ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">
                <ChevronDown size={17} className="animate-bounce motion-reduce:animate-none" />
              </span>
              Favor bajar para ver más campos que completar
            </button>
          </div>
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-stretch">
          {/* PASO 1: Datos Básicos */}
          <div className={`${styleSection} order-2 min-w-0 flex-1 2xl:order-1`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-4">
              <span className={styleStepBadge}>PRODUCTO</span>
              <h4 className="text-sm sm:text-base md:text-base font-bold text-slate-700">Datos Básicos</h4>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 2xl:grid-cols-4">
              {/* Nombre del Producto */}
              <div>
                <label className={styleLabel}>
                  Nombre del Producto <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_producto"
                  value={formData.nombre_producto}
                  onChange={handleChange}
                  placeholder="Ej: Coca Cola 2L"
                  className={styleInput}
                />
              </div>

              {/* Código de Barras */}
              <div>
                <label className={styleLabel}>Código de Barras</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    name="cod_barra"
                    value={formData.cod_barra}
                    onChange={handleChange}
                    placeholder="7891000053508"
                    className={`${styleInput} flex-1 min-w-0`}
                  />
                  <BotonGenerarCodigoBarra
                    evitar={formData.cod_barra ? [formData.cod_barra] : []}
                    onCodigo={(c) => setFormData((prev: any) => ({ ...prev, cod_barra: c }))}
                    className="py-3"
                  />
                  <button
                    type="button"
                    onClick={() => setEtiquetasAbierto(true)}
                    disabled={!String(formData.cod_barra || '').trim()}
                    title="Imprimir etiquetas con el código de barras de este producto"
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-700 px-3 py-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:bg-gray-300"
                  >
                    Etiquetas
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className={styleLabel}>
                  Categoría <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setModalCategoriaOpen(true)}
                  className="
                      w-full
                      bg-white dark:bg-slate-800
                      border-2 border-blue-300 dark:border-blue-700
                      rounded-xl
                      px-3 py-2 sm:px-4 sm:py-3 md:px-4 md:py-3
                      text-xs sm:text-sm md:text-sm font-medium
                      text-slate-700 dark:text-slate-100
                      hover:bg-blue-50 dark:hover:bg-slate-700
                      hover:border-blue-400
                      text-left
                      focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800
                      focus:border-blue-500 dark:focus:border-blue-400
                      truncate transition-all shadow-sm hover:shadow-md
                    "
                >
                  {categoriaNombre || 'Seleccionar Categoría'}
                </button>
              </div>

              {/* Ubicación */}
              <div>
                <label className={styleLabel}>Ubicación</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  placeholder="Estante A1"
                  className={styleInput}
                />
              </div>
            </div>
            <DatosFarmaciaProducto className="mt-3" valores={formData} onCambio={(campo, valor) => setFormData((prev: any) => ({ ...prev, [campo]: valor }))} />
          </div>
            <div className="order-1 w-full 2xl:order-2 2xl:w-[340px] 2xl:shrink-0">
              <ImagenProducto id={id} />
            </div>
          </div>

          {/* PASO 2: Precios y Configuración */}
          <div className={styleSectionGreen}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-4">
              <span className={styleStepBadgeGreen}>VENTA</span>
              <h4 className="text-sm sm:text-base md:text-base font-bold text-slate-700">Precios y Configuración</h4>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
              {/* Unidad de Medida */}
              <div>
                <label className={styleLabel}>
                  Unidad de Medida <span className="text-rose-500">*</span>
                </label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className={styleInput + " cursor-pointer"}
                >
                  <option value="">Seleccionar</option>
                  <option value="KG">Kilogramo</option>
                  <option value="UNIDAD">Unidad</option>
                  {formData.unidad_medida === 'PAQUETE' && <option value="PAQUETE">Paquete</option>}
                  {formData.unidad_medida === 'CAJA' && <option value="CAJA">Caja</option>}
                  <option value="LITRO">Litro</option>
                </select>
              </div>

              {/* IVA */}
              <div>
                <label className={styleLabel}>
                  IVA <span className="text-rose-500">*</span>
                </label>
                <select
                  name="iva"
                  value={formData.iva}
                  onChange={handleChange}
                  className={styleInput + " cursor-pointer"}
                >
                  <option value="">Seleccionar IVA</option>
                  <option value="0">Exenta (0%)</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className={styleLabel}>Estado</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className={styleInput + " cursor-pointer"}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              {/* Precio de Compra (solo si es inventario inicial) */}
              {esInventarioInicial && (
                <div>
                  <label className={styleLabel}>
                    Precio de Compra
                    <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 sm:px-2 rounded">Inv. Inicial</span>
                  </label>
                  <NumericFormat
                    value={formData.precio_compra}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale={false}
                    allowNegative={false}
                    onValueChange={(values) => handleNumericChange('precio_compra', values.value || '')}
                    placeholder="0,00"
                    className="w-full bg-white border-2 border-amber-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-amber-700 placeholder-slate-400 focus:ring-4 focus:ring-amber-200 focus:border-amber-500 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              )}

              {/* Precio de Venta */}
              <div>
                <label className={styleLabel}>
                  {etiquetaPrecioBase} <span className="text-rose-500">*</span>
                </label>
                <NumericFormat
                  value={formData.precio_venta}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  fixedDecimalScale={false}
                  allowNegative={false}
                  onValueChange={(values) => handleNumericChange('precio_venta', values.value || '')}
                  placeholder="0,00"
                  className="w-full bg-white border-2 border-emerald-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-emerald-700 placeholder-slate-400 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
                />
                {ayudaPrecioBase && <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">{ayudaPrecioBase}</p>}
              </div>

              {/* Precio Venta Caja (solo si es CAJA) */}
              {formData.unidad_medida === 'CAJA' && (
                <div>
                  <label className={styleLabel}>P. Venta por Caja</label>
                  <NumericFormat
                    value={formData.precio_venta_caja}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    fixedDecimalScale={false}
                    allowNegative={false}
                    onValueChange={(values) => handleNumericChange('precio_venta_caja', values.value || '')}
                    placeholder="0,00"
                    className="w-full bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-emerald-700 placeholder-slate-400 focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md"
                  />
                  <AyudaPrecioUnidad precio={formData.precio_venta_caja} unidades={formData.cant_p_caja} precioSuelta={formData.precio_venta} />
                </div>
              )}
            </div>
          </div>

          {/* PASO 3: Configuración de Caja (solo si es CAJA) */}
          {formData.unidad_medida === 'CAJA' && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 sm:p-4 md:p-4 border border-orange-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-4">
                <span className={styleStepBadgeGreen}>CAJA</span>
                <h4 className="text-sm sm:text-base md:text-base font-bold text-slate-700">Configuración de Caja</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-4">
                {/* Cantidad por Caja */}
                <div>
                  <label className={styleLabel}>Unidades por Caja</label>
                  <NumericFormat
                    value={formData.cant_p_caja}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={(values) => handleNumericChange('cant_p_caja', values.value || '')}
                    placeholder="Ej: 24"
                    className="w-full bg-white border-2 border-orange-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-orange-700 placeholder-slate-400 focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all shadow-sm hover:shadow-md"
                  />
                </div>

                {/* Precio Compra Caja (solo si es inventario inicial) */}
                {esInventarioInicial && (
                  <div>
                    <label className={styleLabel}>
                      P. Compra por Caja
                      <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 sm:px-2 rounded">Inv. Inicial</span>
                    </label>
                    <NumericFormat
                      value={formData.precio_compra_caja}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale={false}
                      allowNegative={false}
                      onValueChange={(values) => handleNumericChange('precio_compra_caja', values.value || '')}
                      placeholder="0,00"
                      className="w-full bg-white border-2 border-amber-300 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-sm font-bold text-amber-700 placeholder-slate-400 focus:ring-4 focus:ring-amber-200 focus:border-amber-500 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón Guardar */}
          <div id="editar-producto-mas-campos" className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-violet-950 dark:text-violet-100">Venta por pack</h4>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-900 dark:text-violet-200">Opcional</span>
              </div>
              <p className="mt-1 text-xs text-violet-900/80 dark:text-violet-200/80">
                Completá estos datos solo si también vendés varias unidades juntas. Si vendés únicamente por unidad, dejalos vacíos.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={styleLabel}>Unidades que incluye cada pack</label>
                <NumericFormat value={formData.cant_p_pack} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={(v) => handleNumericChange('cant_p_pack', v.value || '')} placeholder="Ej: 6" className="w-full rounded-xl border-2 border-violet-300 bg-white px-3 py-2 dark:bg-slate-900 dark:text-white" />
              </div>
              <div>
                <label className={styleLabel}>Precio del pack completo</label>
                <NumericFormat value={formData.precio_venta_pack} thousandSeparator="." decimalSeparator="," decimalScale={2} allowNegative={false} onValueChange={(v) => handleNumericChange('precio_venta_pack', v.value || '')} placeholder="0" className="w-full rounded-xl border-2 border-violet-300 bg-white px-3 py-2 dark:bg-slate-900 dark:text-white" />
                <AyudaPrecioUnidad precio={formData.precio_venta_pack} unidades={formData.cant_p_pack} precioSuelta={formData.precio_venta} />
              </div>
            </div>
          </div>

          {/* Oferta por cantidad: "llevando 3 unidades, el combo sale ₲ 10.000" (se aplica sola en la venta, sobre las unidades sueltas) */}
          <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 p-3 sm:p-4 space-y-2">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Oferta por cantidad (opcional)</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Por ejemplo, 3 unidades por ₲ 10.000. Para quitarla, dejá los dos campos vacíos.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={styleLabel}>Llevando (unidades)</label>
                <NumericFormat value={formData.oferta_cantidad} decimalScale={0} allowNegative={false} onValueChange={(v) => handleNumericChange('oferta_cantidad', v.value || '')} placeholder="3" className="w-full bg-white dark:bg-gray-700 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className={styleLabel}>El combo cuesta</label>
                <NumericFormat value={formData.oferta_precio} thousandSeparator="." decimalSeparator="," decimalScale={0} allowNegative={false} onValueChange={(v) => handleNumericChange('oferta_precio', v.value || '')} placeholder="₲ 0" prefix="₲ " className="w-full bg-white dark:bg-gray-700 dark:text-gray-100 border-2 border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2" />
              </div>
            </div>
            <AyudaPrecioUnidad precio={formData.oferta_precio} unidades={formData.oferta_cantidad} precioSuelta={formData.precio_venta} />
          </div>

          <div className="pt-2 sm:pt-3 md:pt-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 sm:py-3.5 md:py-4 rounded-xl transition-all text-sm sm:text-base md:text-lg font-bold shadow-lg hover:shadow-xl"
            >
              <FiSave className="text-lg sm:text-xl md:text-2xl" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>

      {/* Modales */}
      {etiquetasAbierto && (
        <ModalEtiquetas
          producto={{ nombre_producto: formData.nombre_producto, cod_barra: formData.cod_barra, precio_venta: (formData as any).precio_venta }}
          onClose={() => setEtiquetasAbierto(false)}
        />
      )}
      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Producto actualizado con éxito"
      />
      <ModalError
        isOpen={!!errorMessage}
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
      <ModalConfirmUpdate
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        data={{ ...formData, idcategoria: categoriaNombre || formData.idcategoria }}
      />
      <ModalSeleccionarCategoria
        isOpen={modalCategoriaOpen}
        onClose={() => setModalCategoriaOpen(false)}
        onSelect={(categoria) => {
          setFormData({ ...formData, idcategoria: categoria.idcategorias });
          setCategoriaNombre(categoria.categoria);
          setModalCategoriaOpen(false);
        }}
      />
    </div>
  );
};

export default EditarProducto;
