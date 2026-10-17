import DatosFarmaciaProducto from '../../../components/DatosFarmaciaProducto';
import { IA_HABILITADA } from '../../../config/featureFlags';
'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FaBoxOpen, FaTag, FaChevronRight, FaChevronLeft, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import { NumericFormat } from 'react-number-format';
import MascotaGuia from '../../../components/guia/MascotaTuki';
import { getProductosPaginated } from '../../../services/productos';
import BotonGenerarCodigoBarra from '../../../components/BotonGenerarCodigoBarra';
import ModalAdvert from '../../../components/ModalAdvert';
import AyudaPrecioUnidad from '../../../components/AyudaPrecioUnidad';
import ModalSeleccionarCategoria from '../../../productos/components/ModalsProductos/ModalSeleccionarCategoria';
import ReconocerProductoFoto from '../../../components/ReconocerProductoFoto';
import type { CategoriaEncontrada } from '../../../utils/buscarCategoriaPorNombre';
import { normalizarAPack, type ProductoDetectado, type ProductoCoincidente } from '../../../services/reconocimiento';

interface FormCrearProductoInlineProps {
  onAgregar: (detalle: any) => void;
  onCancelar: () => void;
  /** Códigos de barras de los productos nuevos ya agregados a esta compra (para que el generador no los repita). */
  codigosPendientes?: string[];
}

const IVA_OPCIONES = ['5', '10', '0'];
const UNIDAD_OPCIONES = ['UNIDAD', 'KG', 'L', 'M'];

const initialForm = {
  // Paso 1
  nombre_producto: '',
  idcategoria: '',
  cod_barra: '',
  ubicacion_almacen: 'PRINCIPAL',
  principio_activo: '',
  laboratorio: '',
  receta: 'libre',
  stock_minimo: '',
  // Paso 2
  unidad_medida: 'UNIDAD',
  precio_compra: '',
  iva: '10',
  ganancia: '',
  precio_venta: '',
  precio_compra_caja: '',
  precio_venta_caja: '',
  cant_p_caja: '',
  precio_venta_pack: '',
  oferta_cantidad: '',
  oferta_precio: '',
  cant_p_pack: '',
  // Paso 4
  cantidad: '1',
  fecha_vencimiento: '',
};

const PASOS = [
  { label: 'Datos básicos', num: 1 },
  { label: 'Precio y config', num: 2 },
  { label: 'Stock y venc.', num: 3 },
];

const FormCrearProductoInline = ({ onAgregar, onCancelar, codigosPendientes }: FormCrearProductoInlineProps) => {
  const reducirMovimiento = useReducedMotion();
  const [paso, setPaso] = useState(1);
  const [guiaModo, setGuiaModo] = useState<'preguntar' | 'seleccionar_tipo' | 'confirmar_tipo' | 'guiando' | 'manual'>('manual');
  const [tipoProductoGuia, setTipoProductoGuia] = useState<'UNIDAD' | 'PAR' | 'PACK' | 'KG' | 'L' | 'M' | 'CAJA' | null>(null);
  const [guiaIndex, setGuiaIndex] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);

  // Validar duplicado
  const [validandoProducto, setValidandoProducto] = useState(false);
  const [modalDuplicadoOpen, setModalDuplicadoOpen] = useState(false);
  const [productoDuplicado, setProductoDuplicado] = useState<any>(null);

  // Reconocimiento por foto (IA)
  const [errorFotoMessage, setErrorFotoMessage] = useState('');
  const [modalErrorFotoOpen, setModalErrorFotoOpen] = useState(false);

  // Errors
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Con el costo y el % de ganancia se SUGIEREN los precios de venta (unidad, pack y caja). Después cada uno se puede
  // cambiar por separado: normalmente la unidad suelta sale más cara que el pack y la caja por unidad.
  const sugerirPrecios = (f: typeof initialForm): typeof initialForm => {
    const g = parseFloat(f.ganancia || '0');
    const porCaja = parseFloat(f.cant_p_caja || '0');
    const porPack = parseFloat(f.cant_p_pack || '0');
    const costoUnidad = f.unidad_medida === 'CAJA'
      ? (porCaja > 0 ? parseFloat(f.precio_compra_caja || '0') / porCaja : 0)
      : parseFloat(f.precio_compra || '0');
    if (!(g > 0) || !(costoUnidad > 0)) return f;
    const out = { ...f, precio_venta: Math.round(costoUnidad * (1 + g / 100)).toString() };
    if (f.unidad_medida === 'CAJA' && porCaja > 0) out.precio_venta_caja = Math.round(costoUnidad * porCaja * (1 + g / 100)).toString();
    if (porPack > 0) out.precio_venta_pack = Math.round(costoUnidad * porPack * (1 + g / 100)).toString();
    return out;
  };

  const GATILLOS = ['ganancia', 'precio_compra', 'precio_compra_caja', 'cant_p_caja', 'cant_p_pack', 'unidad_medida'];

  const set = (field: string, value: string) => {
    setForm(prev => {
      let next = { ...prev, [field]: value };
      // El costo de la unidad sí sale de la caja (cuánto te cuesta cada una).
      if (next.unidad_medida === 'CAJA' && (field === 'precio_compra_caja' || field === 'cant_p_caja')) {
        const pc = parseFloat(next.precio_compra_caja || '0');
        const cpp = parseFloat(next.cant_p_caja || '0');
        if (pc > 0 && cpp > 0) next.precio_compra = (pc / cpp).toString();
      }
      if (GATILLOS.includes(field)) next = sugerirPrecios(next);
      return next;
    });
    setErrores(prev => ({ ...prev, [field]: '' }));
  };

  const validarPaso1 = () => {
    const e: Record<string, string> = {};
    if (!form.nombre_producto.trim()) e.nombre_producto = 'El nombre es obligatorio.';
    if (!form.idcategoria) e.idcategoria = 'Seleccioná una categoría.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso2 = () => {
    const e: Record<string, string> = {};
    if (form.unidad_medida === 'CAJA') {
      if (!form.precio_compra_caja) e.precio_compra_caja = 'El precio de compra por caja es obligatorio.';
      if (!form.cant_p_caja) e.cant_p_caja = 'La cantidad por caja es obligatoria.';
      if (!form.precio_venta_caja) e.precio_venta_caja = 'El precio de venta por caja es obligatorio.';
      if (!form.precio_venta) e.precio_venta = 'El precio de venta por unidad suelta es obligatorio.';
    } else {
      if (!form.precio_compra) e.precio_compra = 'El precio de compra es obligatorio.';
      if (!form.precio_venta) e.precio_venta = 'El precio de venta es obligatorio.';
    }
    if (Number(form.cant_p_pack) > 0 && !form.precio_venta_pack) e.precio_venta_pack = 'Indicá el precio de venta del pack.';
    if (guiaModo === 'guiando' && tipoProductoGuia === 'PACK' && !(Number(form.cant_p_pack) > 0)) e.cant_p_pack = 'Indica cuántas unidades trae el pack.';
    // Oferta por cantidad ("3 por 10.000"): opcional, pero si se carga tiene que estar completa y convenir.
    if (form.oferta_cantidad || form.oferta_precio) {
      const n = Number(form.oferta_cantidad); const pr = Number(form.oferta_precio); const u = Number(form.precio_venta);
      if (!Number.isInteger(n) || n < 2) e.oferta_cantidad = 'Indicá cuántas unidades lleva la oferta (2 o más).';
      else if (!(pr > 0)) e.oferta_precio = 'Indicá el precio de la oferta.';
      else if (u > 0 && pr >= n * u) e.oferta_precio = `Tiene que salir más barata que ${n} sueltas (₲ ${(n * u).toLocaleString('es-PY')}).`;
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const validarPaso3 = () => {
    const e: Record<string, string> = {};
    if (!form.cantidad || parseFloat(form.cantidad) <= 0) e.cantidad = 'La cantidad debe ser mayor a 0.';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSiguiente = () => {
    if (paso === 1 && !validarPaso1()) return;
    if (paso === 2 && !validarPaso2()) return;
    setPaso(p => p + 1);
    setGuiaIndex(0);
  };

  const handleValidarDuplicado = async (campo: 'nombre_producto' | 'cod_barra' = 'nombre_producto') => {
    const termino = form[campo].trim();
    if (!termino) return;
    setValidandoProducto(true);
    try {
      const res = await getProductosPaginated({ page: 1, limit: 5, search: termino });
      const raw2 = res.data;
      const lista = Array.isArray(raw2)
        ? raw2
        : Array.isArray(raw2?.productos)
          ? raw2.productos
          : Array.isArray(raw2?.data)
            ? raw2.data
            : [];
      const encontrado = lista.find((p: any) =>
        campo === 'cod_barra'
          ? String(p.cod_barra ?? '').trim() === termino
          : p.nombre_producto?.toLowerCase() === termino.toLowerCase()
      );
      if (encontrado) {
        setProductoDuplicado(encontrado);
        setModalDuplicadoOpen(true);
      } else {
        setErrores(prev => ({ ...prev, nombre_producto: '' }));
        // Visual feedback sin modal
        setProductoDuplicado(null);
        // Pequeño feedback temporal
        setErrores(prev => ({ ...prev, _validado: campo === 'cod_barra' ? 'ok_cod' : 'ok' }));
        setTimeout(() => setErrores(prev => { const n = { ...prev }; delete n._validado; return n; }), 2000);
      }
    } catch {
      // silenciar error
    } finally {
      setValidandoProducto(false);
    }
  };

  const handleProductoDetectado = (
    producto: ProductoDetectado,
    coincidencias: ProductoCoincidente[],
    categoria: CategoriaEncontrada | null,
  ) => {
    // Si hay un match fuerte (>=70%) avisamos como con handleValidarDuplicado:
    // mejor seleccionarlo existente que duplicarlo. Igual autocompletamos el
    // form por si el usuario prefiere seguir con uno nuevo (ej. variante
    // distinta que el matching no distinguió).
    const mejorMatch = coincidencias[0];
    if (mejorMatch && mejorMatch.similitud >= 70) {
      setProductoDuplicado(mejorMatch);
      setModalDuplicadoOpen(true);
    }

    const detectado = normalizarAPack(producto);
    setForm((prev) => ({
      ...prev,
      nombre_producto: detectado.nombre_producto || prev.nombre_producto,
      cod_barra: detectado.cod_barra || prev.cod_barra,
      unidad_medida: detectado.unidad_medida_sugerida,
      cant_p_pack: detectado.unidades_por_pack ? String(detectado.unidades_por_pack) : prev.cant_p_pack,
      idcategoria: categoria ? String(categoria.idcategorias) : prev.idcategoria,
    }));
    if (categoria) setCategoriaSeleccionada(categoria);
    setErrores((prev) => ({ ...prev, nombre_producto: '', ...(categoria ? { idcategoria: '' } : {}) }));
  };

  const handleAgregar = () => {
    if (!validarPaso3()) return;

    const idtemp = `temp-${Date.now()}`;
    const esCaja = form.unidad_medida === 'CAJA';

    const detalle: any = {
      idproducto: idtemp,
      nombre_producto: form.nombre_producto.trim(),
      cantidad: form.cantidad,
      precio: esCaja
        ? (parseFloat(form.precio_compra_caja || '0') / parseFloat(form.cant_p_caja || '1')).toString()
        : form.precio_compra,
      precio_compra: esCaja
        ? (parseFloat(form.precio_compra_caja || '0') / parseFloat(form.cant_p_caja || '1')).toString()
        : form.precio_compra,
      precio_venta: form.precio_venta,
      precio_venta_caja: esCaja ? form.precio_venta_caja : null,
      precio_venta_pack: form.precio_venta_pack || null,
      oferta_cantidad: form.oferta_cantidad || null,
      oferta_precio: form.oferta_precio || null,
      cant_p_pack: form.cant_p_pack || null,
      precio_compra_caja: esCaja ? form.precio_compra_caja : null,
      cant_p_caja: esCaja ? form.cant_p_caja : null,
      cant_cajas: esCaja ? form.cantidad : null,
      unidad_medida: form.unidad_medida,
      iva: form.iva,
      idcategoria: form.idcategoria,
      cod_barra: form.cod_barra,
      numero_lote: '01',
      referencia_proveedor: '',
      ubicacion_almacen: form.ubicacion_almacen || 'PRINCIPAL',
      principio_activo: form.principio_activo || null,
      laboratorio: form.laboratorio || null,
      receta: form.receta || 'libre',
      stock_minimo: form.stock_minimo || null,
      fecha_vencimiento: form.fecha_vencimiento || '',
    };

    onAgregar(detalle);
    setForm(initialForm);
    setPaso(1);
  };


  const tipoGuiado = guiaModo === 'guiando' ? tipoProductoGuia : null;
  const cajaGuiada = tipoGuiado ? tipoGuiado === 'CAJA' : form.unidad_medida === 'CAJA';
  const packGuiado = tipoGuiado ? tipoGuiado === 'PACK' : Number(form.cant_p_pack) > 0;
  const guiaItems = paso === 1
    ? [
        { target: 'nombre_producto', titulo: 'Nombre del producto', texto: tipoGuiado === 'PAR' ? 'Escribe el modelo y, si manejas stock por variante, agrega talle y color (por ejemplo: Zapatilla modelo X, talle 38, negro). Cada registro representa un par completo.' : 'Escribe el nombre tal como aparece en la factura. Si ya existe, usa “Validar” para evitar duplicarlo.' },
        { target: 'categoria', titulo: 'Categoría', texto: 'Selecciona la categoría que mejor describe el producto.' },
        { target: 'cod_barra', titulo: 'Código de barras', texto: 'Escanea o escribe el código si está disponible. Este dato es opcional.' },
        { target: 'ubicacion', titulo: 'Ubicación', texto: 'Indica dónde guardarás el producto. Puedes dejar PRINCIPAL.' },
      ]
    : paso === 2
      ? [
          ...(guiaModo !== 'guiando' || !tipoProductoGuia ? [{ target: 'unidad_medida', titulo: 'Presentación base', texto: 'Elige cómo se controla el producto.' }] : []),
          { target: 'iva', titulo: 'IVA', texto: 'Confirma el IVA de la factura. El valor inicial es 10%.' },
          ...(cajaGuiada ? [{ target: 'cant_p_caja', titulo: 'Unidades por caja', texto: 'Escribe cuántas unidades trae cada caja. Esto permite calcular el costo por unidad.' }] : []),
          { target: cajaGuiada ? 'precio_compra_caja' : 'precio_compra', titulo: 'Costo de compra', texto: cajaGuiada ? 'Escribe el costo de la caja según la factura.' : tipoGuiado === 'KG' ? 'Escribe el costo por kilogramo según la factura.' : tipoGuiado === 'L' ? 'Escribe el costo por litro según la factura.' : tipoGuiado === 'M' ? 'Escribe el costo por metro según la factura.' : tipoGuiado === 'PAR' ? 'Escribe el costo por par completo; cada par cuenta como una unidad.' : 'Escribe el costo de compra por unidad según la factura.' },
          ...((tipoGuiado === 'PACK' || (!tipoGuiado && Number(form.cant_p_pack) > 0)) ? [{ target: 'cant_p_pack', titulo: 'Unidades por pack', texto: 'Indica cuántas unidades contiene cada pack. Por ejemplo, escribe 9 para un pack de nueve.' }] : (!tipoGuiado ? [{ target: 'cant_p_pack', titulo: '¿Viene en pack?', texto: 'Si también vendes este producto en pack, escribe cuántas unidades contiene. Si no, déjalo vacío.' }] : [])),
          ...(packGuiado && Number(form.cant_p_pack) > 0 ? [{ target: 'precio_venta_pack', titulo: 'Precio del pack', texto: `Indica el precio de venta del pack de ${form.cant_p_pack} unidades.` }] : []),
          ...(cajaGuiada ? [{ target: 'precio_venta_caja', titulo: 'Precio de venta por caja', texto: `Indica a qué precio venderás la caja de ${form.cant_p_caja || 'unidades indicadas'}.` }] : []),
          { target: 'precio_venta', titulo: tipoGuiado === 'KG' ? 'Precio por kilogramo' : tipoGuiado === 'L' ? 'Precio por litro' : tipoGuiado === 'M' ? 'Precio por metro' : tipoGuiado === 'PAR' ? 'Precio por par completo' : 'Precio por unidad', texto: tipoGuiado === 'KG' ? 'Indica el precio de venta por kilogramo.' : tipoGuiado === 'L' ? 'Indica el precio de venta por litro.' : tipoGuiado === 'M' ? 'Indica el precio de venta por metro.' : tipoGuiado === 'PAR' ? 'Indica el precio de venta de un par completo.' : 'Indica el precio de venta de una unidad suelta. Puedes ajustar el valor sugerido.' },
        ]
      : [
          { target: 'cantidad', titulo: 'Cantidad recibida', texto: cajaGuiada ? 'Escribe cuántas cajas recibiste. El sistema usará las unidades por caja para calcular el stock.' : tipoGuiado === 'PAR' ? 'Escribe cuántos pares completos recibiste; cada par se cuenta como una unidad.' : 'Escribe la cantidad recibida que figura en la factura.' },
          { target: 'fecha_vencimiento', titulo: 'Vencimiento', texto: 'Si el producto tiene vencimiento, selecciónalo aquí. Si no aplica, puedes dejarlo vacío.' },
        ];
  const guiaActual = guiaItems[Math.min(guiaIndex, guiaItems.length - 1)];

  useEffect(() => {
    if (guiaModo !== 'guiando' || !guiaActual) return;
    const elemento = document.querySelector<HTMLElement>(`[data-guide-target="${guiaActual.target}"]`);
    if (!elemento) return;
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elemento.focus({ preventScroll: true });
    elemento.style.outline = '3px solid #10b981';
    elemento.style.outlineOffset = '3px';
    elemento.style.boxShadow = '0 0 0 6px rgba(16, 185, 129, 0.16)';
    return () => {
      elemento.style.outline = '';
      elemento.style.outlineOffset = '';
      elemento.style.boxShadow = '';
    };
  }, [guiaModo, guiaActual?.target]);

  const iniciarGuiaTipo = (tipo: 'UNIDAD' | 'PAR' | 'PACK' | 'KG' | 'L' | 'M' | 'CAJA') => {
    setTipoProductoGuia(tipo);
    setForm(prev => ({
      ...prev,
      unidad_medida: tipo === 'KG' || tipo === 'L' || tipo === 'M' ? tipo : tipo === 'CAJA' ? 'CAJA' : 'UNIDAD',
      cant_p_pack: tipo === 'PACK' ? '' : prev.cant_p_pack,
      precio_venta_pack: tipo === 'PACK' ? '' : prev.precio_venta_pack,
      cant_p_caja: tipo === 'CAJA' ? prev.cant_p_caja : '',
      precio_compra_caja: tipo === 'CAJA' ? prev.precio_compra_caja : '',
      precio_venta_caja: tipo === 'CAJA' ? prev.precio_venta_caja : '',
    }));
    setPaso(1);
    setGuiaIndex(0);
    setErrores({});
    setGuiaModo('guiando');
  };

  const avanzarGuia = () => {
    if (paso === 2 && tipoProductoGuia === 'PACK' && guiaActual.target === 'cant_p_pack' && !(Number(form.cant_p_pack) > 0)) {
      setErrores(prev => ({ ...prev, cant_p_pack: 'Indica cuántas unidades trae el pack.' }));
      return;
    }
    if (guiaIndex < guiaItems.length - 1) {
      setGuiaIndex(index => index + 1);
      return;
    }
    if (paso < 3) handleSiguiente();
    else handleAgregar();
  };
  return (
    <div className="flex flex-col h-[min(680px,70vh)] bg-white dark:bg-gray-800 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-800 dark:to-emerald-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FaBoxOpen className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Crear nuevo producto</h2>
              <p className="text-xs text-green-100">Se agregará al inventario al registrar la compra</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            title="Cancelar"
          >
            <FaTimes className="text-white" size={14} />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-1 mt-3">
          {PASOS.map((p, i) => (
            <div key={p.num} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-all ${paso === p.num
                ? 'bg-white text-green-700'
                : paso > p.num
                  ? 'bg-green-400/40 text-white'
                  : 'bg-white/10 text-green-200'
                }`}>
                {paso > p.num ? <FaCheck size={10} /> : <span>{p.num}</span>}
                <span className="hidden sm:inline">{p.label}</span>
              </div>
              {i < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 rounded ${paso > p.num ? 'bg-green-400' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guía contextual */}
      <div className={`px-4 py-4 ${guiaModo === 'manual' ? 'hidden' : ''} ${guiaModo === 'preguntar' || guiaModo === 'seleccionar_tipo' || guiaModo === 'confirmar_tipo' ? 'flex flex-1 items-center justify-center' : ''}`}>
        {guiaModo === 'preguntar' && (
          <motion.section initial={reducirMovimiento ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-5 text-white shadow-2xl sm:p-7">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <MascotaGuia feliz />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Tuki · asistente de inventario</p>
                <h3 className="mt-2 text-xl font-extrabold sm:text-2xl">¿Querés que te guíe?</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-200">Puedo acompañarte campo por campo y mostrarte solo lo necesario para cargar el producto de tu factura.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <motion.button type="button" whileHover={reducirMovimiento ? undefined : { scale: 1.03 }} whileTap={reducirMovimiento ? undefined : { scale: 0.97 }} onClick={() => setGuiaModo('seleccionar_tipo')} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg">Sí, guíame <FaChevronRight className="ml-1 inline" size={11} /></motion.button>
                  <button type="button" onClick={() => setGuiaModo('manual')} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">No, cargar manualmente</button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {guiaModo === 'seleccionar_tipo' && (
          <motion.section initial={reducirMovimiento ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-5 text-white shadow-2xl sm:p-7">
            <div className="flex items-center gap-3"><MascotaGuia feliz /><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Tuki quiere saber</p><h3 className="mt-1 text-xl font-extrabold">¿Cómo se cuenta o vende este producto?</h3><p className="mt-1 text-sm text-slate-200">Elegí según la factura y cómo lo vendes en tu negocio.</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {([
                { tipo: 'UNIDAD' as const, nombre: 'Unidad', detalle: 'Se vende por unidad suelta', icono: <FaTag /> },
                { tipo: 'PAR' as const, nombre: 'Par', detalle: 'Zapatos: cada par completo cuenta como una unidad', icono: <span className="text-sm font-black">2×</span> },
                { tipo: 'PACK' as const, nombre: 'Pack', detalle: 'Caja, blíster o paquete con varias unidades', icono: <FaBoxOpen /> },
                { tipo: 'KG' as const, nombre: 'Por kilogramo', detalle: 'Se pesa y vende por kg', icono: <span className="text-sm font-black">KG</span> },
                { tipo: 'L' as const, nombre: 'Por litro', detalle: 'Líquidos vendidos por litro', icono: <span className="text-sm font-black">L</span> },
                { tipo: 'M' as const, nombre: 'Por metro', detalle: 'Telas, cables y productos por longitud', icono: <span className="text-sm font-black">M</span> },
              ]).map(opcion => (
                <motion.button key={opcion.tipo} type="button" whileHover={reducirMovimiento ? undefined : { y: -3, scale: 1.02 }} whileTap={reducirMovimiento ? undefined : { scale: 0.98 }} onClick={() => { setTipoProductoGuia(opcion.tipo); setGuiaModo('confirmar_tipo'); }} className="flex min-h-24 items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-left transition hover:border-cyan-200/70 hover:bg-cyan-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-emerald-300 text-lg text-slate-950">{opcion.icono}</span><span><strong className="block text-sm text-white">{opcion.nombre}</strong><small className="mt-1 block text-xs leading-snug text-slate-300">{opcion.detalle}</small></span>
                </motion.button>
              ))}
            </div>
            <button type="button" onClick={() => setGuiaModo('preguntar')} className="mt-4 text-xs font-medium text-cyan-100/80 underline">Volver</button>
          </motion.section>
        )}

        {guiaModo === 'confirmar_tipo' && tipoProductoGuia && (
          <motion.section initial={reducirMovimiento ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-5 text-center text-white shadow-2xl sm:p-7">
            <MascotaGuia feliz />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Confirmemos antes de empezar</p>
            <h3 className="mt-2 text-xl font-extrabold">Vas a cargar: {tipoProductoGuia === 'KG' ? 'Por kilogramo' : tipoProductoGuia === 'L' ? 'Por litro' : tipoProductoGuia === 'M' ? 'Por metro' : tipoProductoGuia === 'PAR' ? 'Par completo (cuenta como una unidad)' : tipoProductoGuia === 'PACK' ? 'Pack' : tipoProductoGuia === 'CAJA' ? 'Caja' : 'Unidad'}</h3>
            <p className="mt-2 text-sm text-slate-200">¿Es correcto? Después te guío por los campos necesarios.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setGuiaModo('seleccionar_tipo')} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Cambiar tipo</button>
              <motion.button type="button" whileHover={reducirMovimiento ? undefined : { scale: 1.03 }} whileTap={reducirMovimiento ? undefined : { scale: 0.97 }} onClick={() => iniciarGuiaTipo(tipoProductoGuia)} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg">Sí, empezar <FaChevronRight className="ml-1 inline" size={11} /></motion.button>
            </div>
          </motion.section>
        )}

        {guiaModo === 'guiando' && (
          <motion.section initial={reducirMovimiento ? false : { opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={reducirMovimiento ? { duration: 0 } : undefined} className="relative w-full overflow-hidden rounded-2xl border border-cyan-300/40 bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-3 text-white shadow-[0_12px_32px_rgba(8,47,73,0.25)] sm:p-4" role="status" aria-live="polite">
            <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="relative flex items-center gap-3 sm:gap-5">
              <MascotaGuia feliz={guiaIndex === guiaItems.length - 1} />
              <div className="min-w-0 flex-1 self-stretch py-1">
                <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">Tuki · {tipoProductoGuia === 'KG' ? 'producto por kg' : tipoProductoGuia === 'PACK' ? 'producto en pack' : tipoProductoGuia === 'CAJA' ? 'producto en caja' : 'producto por unidad'}</p><span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"><motion.span className="h-1.5 w-1.5 rounded-full bg-lime-300" animate={reducirMovimiento ? undefined : { opacity: [.45, 1, .45], scale: [.85, 1.15, .85] }} transition={{ duration: 1.5, repeat: Infinity }} />Te acompaño paso a paso</span></div><button type="button" onClick={() => setGuiaModo('manual')} className="rounded-full px-2 py-1 text-[10px] font-medium text-cyan-100/80 underline hover:bg-white/10">Seguir manual</button></div>
                <AnimatePresence mode="wait"><motion.div key={guiaActual.target} initial={reducirMovimiento ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={reducirMovimiento ? undefined : { opacity: 0, x: -8 }} transition={reducirMovimiento ? { duration: 0 } : { duration: 0.2 }} className="mt-2 min-h-[52px]"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-300/15 text-xs font-bold text-cyan-100">{guiaIndex + 1}</span><p className="text-sm font-bold text-white">{guiaActual.titulo}</p></div><p className="mt-1.5 text-xs leading-relaxed text-slate-200">{guiaActual.texto}</p></motion.div></AnimatePresence>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-lime-300" animate={{ width: `${((guiaIndex + 1) / guiaItems.length) * 100}%` }} transition={reducirMovimiento ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }} /></div>
                <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] font-medium text-cyan-100/70">{guiaIndex + 1} / {guiaItems.length}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setGuiaIndex(index => Math.max(0, index - 1))} disabled={guiaIndex === 0} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-white/10 disabled:opacity-40">Atrás</button><motion.button type="button" onClick={avanzarGuia} whileHover={reducirMovimiento ? undefined : { scale: 1.04 }} whileTap={reducirMovimiento ? undefined : { scale: 0.96 }} className="rounded-lg bg-gradient-to-r from-cyan-300 to-emerald-300 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-950/30">{guiaIndex < guiaItems.length - 1 ? 'Siguiente campo' : paso < 3 ? 'Continuar' : 'Agregar producto'} <FaChevronRight className="ml-1 inline" size={9} /></motion.button></div></div>
              </div>
            </div>
          </motion.section>
        )}

      </div>      {/* Body */}
      <div className={guiaModo === 'preguntar' || guiaModo === 'seleccionar_tipo' || guiaModo === 'confirmar_tipo' ? 'hidden' : 'p-4 flex-1 overflow-y-auto'}>

        {/* ─── PASO 1: Datos básicos ─── */}
        {paso === 1 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Datos básicos</p>

            {/* Reconocer por foto: autocompleta nombre, presentación (CAJA/UNIDAD) y código de barra */}
            {IA_HABILITADA && (
<ReconocerProductoFoto
              onDetectado={handleProductoDetectado}
              onError={(msg) => { setErrorFotoMessage(msg); setModalErrorFotoOpen(true); }}
            />
)}

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.nombre_producto}
                  data-guide-target="nombre_producto"
                  onChange={e => set('nombre_producto', e.target.value)}
                  placeholder="Ej: Paracetamol 500mg"
                  className={`flex-1 px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent ${errores.nombre_producto ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
                <button
                  type="button"
                  onClick={() => handleValidarDuplicado('nombre_producto')}
                  disabled={validandoProducto || !form.nombre_producto.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-md font-medium transition-colors whitespace-nowrap"
                  title="Verificar si el producto ya existe"
                >
                  {validandoProducto ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <FaSearch size={11} />
                  )}
                  Validar
                </button>
              </div>
              {errores.nombre_producto && <p className="text-xs text-red-500 mt-1">{errores.nombre_producto}</p>}
              {errores._validado === 'ok' && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <FaCheck size={10} /> Producto no encontrado, podés continuar.
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCategoriaModal(true)}
                data-guide-target="categoria"
                className={`w-full border px-4 py-2 rounded-lg text-left bg-gray-50 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-2 focus:ring-green-500 text-sm ${errores.idcategoria ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              >
                {categoriaSeleccionada
                  ? <span className="flex items-center gap-1.5"><FaTag size={11} className="text-green-600" />{categoriaSeleccionada.categoria || categoriaSeleccionada.nombre_categoria || categoriaSeleccionada.nombre}</span>
                  : <span className="text-gray-400 dark:text-gray-400">Seleccionar categoría...</span>
                }
              </button>
              {errores.idcategoria && <p className="text-xs text-red-500 mt-1">{errores.idcategoria}</p>}
            </div>

            {/* Cod barra + Ubicación */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cód. de barra</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cod_barra}
                    data-guide-target="cod_barra"
                    maxLength={100}
                    onChange={e => set('cod_barra', e.target.value)}
                    // El lector de código de barras termina con Enter: verifica solo, sin tocar el botón.
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleValidarDuplicado('cod_barra'); } }}
                    placeholder="Escriba o escanee el codigo de barras"
                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500"
                  />
                  <BotonGenerarCodigoBarra
                    evitar={[...(codigosPendientes || []), form.cod_barra].filter(Boolean)}
                    onCodigo={(c) => { set('cod_barra', c); setErrores(prev => { const { _validado, ...resto } = prev; return resto; }); }}
                    className="py-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleValidarDuplicado('cod_barra')}
                    disabled={validandoProducto || !form.cod_barra.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-md font-medium transition-colors whitespace-nowrap"
                    title="Verificar si ya existe un producto con este código de barras"
                  >
                    {validandoProducto ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <FaSearch size={11} />
                    )}
                    Validar
                  </button>
                </div>
                {errores._validado === 'ok_cod' && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <FaCheck size={10} /> Código disponible: no hay otro producto con él.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion_almacen}
                  data-guide-target="ubicacion"
                  onChange={e => set('ubicacion_almacen', e.target.value)}
                  placeholder="PRINCIPAL"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <DatosFarmaciaProducto className="mt-3" valores={form} onCambio={(campo, valor) => set(campo, valor)} />
          </div>
        )}

        {/* ─── PASO 2: Precio y configuración ─── */}
        {paso === 2 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Precio y configuración</p>

            {/* Unidad y IVA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad de medida</label>
                <select
                  value={form.unidad_medida}
                  data-guide-target="unidad_medida"
                  disabled={guiaModo === 'guiando'}
                  onChange={e => set('unidad_medida', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                >
                  {(form.unidad_medida === 'CAJA' ? [...UNIDAD_OPCIONES, 'CAJA'] : UNIDAD_OPCIONES).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">IVA (%)</label>
                <select
                  value={form.iva}
                  data-guide-target="iva"
                  onChange={e => set('iva', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                >
                  {IVA_OPCIONES.map(i => <option key={i} value={i}>{i}%</option>)}
                </select>
              </div>
            </div>

            {form.unidad_medida === 'CAJA' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unid. por caja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.cant_p_caja}
                    data-guide-target="cant_p_caja"
                    onChange={e => set('cant_p_caja', e.target.value)}
                    placeholder="Ej: 24"
                    className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.cant_p_caja ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errores.cant_p_caja && <p className="text-xs text-red-500 mt-1">{errores.cant_p_caja}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    P. compra (caja) <span className="text-red-500">*</span>
                  </label>
                  <NumericFormat
                    value={form.precio_compra_caja}
                    data-guide-target="precio_compra_caja"
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={v => set('precio_compra_caja', v.value)}
                    placeholder="₲ 0"
                    className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.precio_compra_caja ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    prefix="₲ "
                  />
                  {errores.precio_compra_caja && <p className="text-xs text-red-500 mt-1">{errores.precio_compra_caja}</p>}
                  {parseFloat(form.precio_compra || '0') > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cada unidad te cuesta ₲ {Math.round(parseFloat(form.precio_compra)).toLocaleString('es-PY')}</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  P. compra (unidad) <span className="text-red-500">*</span>
                </label>
                <NumericFormat
                  value={form.precio_compra}
                  data-guide-target="precio_compra"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={0}
                  allowNegative={false}
                  onValueChange={v => set('precio_compra', v.value)}
                  placeholder="₲ 0"
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.precio_compra ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  prefix="₲ "
                />
                {errores.precio_compra && <p className="text-xs text-red-500 mt-1">{errores.precio_compra}</p>}
              </div>
            )}

            {/* Pack (opcional) y ganancia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unidades por pack (opcional)</label>
                <input type="number" min="1" value={form.cant_p_pack}
                  data-guide-target="cant_p_pack" onChange={e => set('cant_p_pack', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100" placeholder="Ej: 6" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">% Ganancia (sugiere los precios)</label>
                <input
                  type="number"
                  min="0"
                  value={form.ganancia}
                  onChange={e => set('ganancia', e.target.value)}
                  placeholder="Ej: 30"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Precios de venta: uno por presentación, independientes entre sí */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 p-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Precios de venta</p>
                {(form.unidad_medida === 'CAJA' || Number(form.cant_p_pack) > 0) && (
                  <p className="text-xs text-blue-800 dark:text-blue-300">Cada presentación tiene su propio precio. Normalmente la caja y el pack salen más baratos por unidad que la unidad suelta.</p>
                )}
              </div>
              <div className={`grid gap-3 ${(form.unidad_medida === 'CAJA' ? 1 : 0) + (Number(form.cant_p_pack) > 0 ? 1 : 0) === 2 ? 'grid-cols-3' : (form.unidad_medida === 'CAJA' || Number(form.cant_p_pack) > 0) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {form.unidad_medida === 'CAJA' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Por caja de {form.cant_p_caja || '…'} <span className="text-red-500">*</span>
                    </label>
                    <NumericFormat
                      value={form.precio_venta_caja}
                      data-guide-target="precio_venta_caja"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      allowNegative={false}
                      onValueChange={v => set('precio_venta_caja', v.value)}
                      placeholder="₲ 0"
                      className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.precio_venta_caja ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                      prefix="₲ "
                    />
                    {errores.precio_venta_caja && <p className="text-xs text-red-500 mt-1">{errores.precio_venta_caja}</p>}
                    <AyudaPrecioUnidad precio={form.precio_venta_caja} unidades={form.cant_p_caja} precioSuelta={form.precio_venta} />
                  </div>
                )}
                {Number(form.cant_p_pack) > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Por pack de {form.cant_p_pack} <span className="text-red-500">*</span>
                    </label>
                    <NumericFormat
                      value={form.precio_venta_pack}
                      data-guide-target="precio_venta_pack"
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={0}
                      allowNegative={false}
                      onValueChange={v => set('precio_venta_pack', v.value)}
                      placeholder="₲ 0"
                      className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.precio_venta_pack ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                      prefix="₲ "
                    />
                    {errores.precio_venta_pack && <p className="text-xs text-red-500 mt-1">{errores.precio_venta_pack}</p>}
                    <AyudaPrecioUnidad precio={form.precio_venta_pack} unidades={form.cant_p_pack} precioSuelta={form.precio_venta} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {form.unidad_medida === 'CAJA' || Number(form.cant_p_pack) > 0 ? 'Por unidad suelta' : 'P. venta (unidad)'} <span className="text-red-500">*</span>
                  </label>
                  <NumericFormat
                    value={form.precio_venta}
                    data-guide-target="precio_venta"
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={v => set('precio_venta', v.value)}
                    placeholder="₲ 0"
                    className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.precio_venta ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    prefix="₲ "
                  />
                  {errores.precio_venta && <p className="text-xs text-red-500 mt-1">{errores.precio_venta}</p>}
                </div>
              </div>

              {/* Oferta por cantidad (opcional): "llevando 3 unidades, el combo sale 10.000" */}
              <div className="rounded-md border border-dashed border-blue-300 dark:border-blue-700 bg-white/70 dark:bg-gray-800/60 p-3">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Oferta por cantidad (opcional)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Por ejemplo, 3 unidades por ₲ 10.000. Se aplica sola en la venta sobre las unidades sueltas.</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <span>Llevando</span>
                  <input
                    type="number"
                    min="2"
                    value={form.oferta_cantidad}
                    onChange={e => set('oferta_cantidad', e.target.value)}
                    placeholder="3"
                    className={`w-16 px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 ${errores.oferta_cantidad ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  <span>unidades, el combo cuesta</span>
                  <NumericFormat
                    value={form.oferta_precio}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={0}
                    allowNegative={false}
                    onValueChange={v => set('oferta_precio', v.value)}
                    placeholder="₲ 0"
                    prefix="₲ "
                    className={`w-32 px-2 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 ${errores.oferta_precio ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                </div>
                {(errores.oferta_cantidad || errores.oferta_precio) && <p className="text-xs text-red-500 mt-1">{errores.oferta_cantidad || errores.oferta_precio}</p>}
                <AyudaPrecioUnidad precio={form.oferta_precio} unidades={form.oferta_cantidad} precioSuelta={form.precio_venta} className="mt-2" />
              </div>
            </div>
          </div>
        )}

        {/* ─── PASO 3: Stock y vencimiento ─── */}
        {paso === 3 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock y vencimiento</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.cantidad}
                  data-guide-target="cantidad"
                  onChange={e => set('cantidad', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500 ${errores.cantidad ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errores.cantidad && <p className="text-xs text-red-500 mt-1">{errores.cantidad}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={form.fecha_vencimiento}
                  data-guide-target="fecha_vencimiento"
                  onChange={e => set('fecha_vencimiento', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Resumen del nuevo producto */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">Resumen del producto nuevo</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-700 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">Nombre:</span>
                <span className="font-medium truncate">{form.nombre_producto}</span>
                <span className="text-gray-500 dark:text-gray-400">Unidad:</span>
                <span>{form.unidad_medida}</span>
                <span className="text-gray-500 dark:text-gray-400">IVA:</span>
                <span>{form.iva}%</span>
                {form.unidad_medida === 'CAJA' ? (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">P. compra caja:</span>
                    <span>₲ {parseFloat(form.precio_compra_caja || '0').toLocaleString('es-PY')}</span>
                    <span className="text-gray-500 dark:text-gray-400">P. venta caja:</span>
                    <span>₲ {parseFloat(form.precio_venta_caja || '0').toLocaleString('es-PY')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-500 dark:text-gray-400">P. compra:</span>
                    <span>₲ {parseFloat(form.precio_compra || '0').toLocaleString('es-PY')}</span>
                    <span className="text-gray-500 dark:text-gray-400">P. venta:</span>
                    <span>₲ {parseFloat(form.precio_venta || '0').toLocaleString('es-PY')}</span>
                  </>
                )}
                <span className="text-gray-500 dark:text-gray-400">N° lote:</span>
                <span>01 (auto)</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer con botones de navegación */}
      <div className={guiaModo === 'preguntar' || guiaModo === 'seleccionar_tipo' || guiaModo === 'confirmar_tipo' ? 'hidden' : 'px-4 pb-4 flex justify-between gap-2 shrink-0'}>
        {paso > 1 ? (
          <button
            type="button"
            onClick={() => { setPaso(p => p - 1); setGuiaIndex(0); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaChevronLeft size={12} /> Anterior
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaTimes size={12} /> Cancelar
          </button>
        )}

        {paso < 3 ? (
          <button
            type="button"
            onClick={handleSiguiente}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Siguiente <FaChevronRight size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAgregar}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <FaCheck size={12} /> Agregar producto
          </button>
        )}
      </div>

      {/* Modal seleccionar categoría */}
      <ModalSeleccionarCategoria
        isOpen={showCategoriaModal}
        onClose={() => setShowCategoriaModal(false)}
        onSelect={(cat) => {
          setCategoriaSeleccionada(cat);
          // La fila de categorías trae `idcategorias` (con s, como la columna).
          // Antes se leía `cat.idcategoria`, que no existe: el producto se
          // guardaba con categoría "undefined" → 0 en la base.
          set('idcategoria', String(cat.idcategorias ?? cat.idcategoria));
          setShowCategoriaModal(false);
          setErrores(prev => ({ ...prev, idcategoria: '' }));
        }}
      />

      {/* Modal producto duplicado */}
      <ModalAdvert
        isOpen={modalDuplicadoOpen}
        onClose={() => setModalDuplicadoOpen(false)}
        message={
          productoDuplicado
            ? `Producto ya existe:\n\n• Nombre: ${productoDuplicado.nombre_producto}\n• Stock: ${productoDuplicado.stock ?? '-'}\n• P. compra: ₲ ${parseFloat(productoDuplicado.precio_compra || '0').toLocaleString('es-PY')}\n• P. venta: ₲ ${parseFloat(productoDuplicado.precio_venta || '0').toLocaleString('es-PY')}\n\nFavor seleccionalo directamente en "Seleccionar producto".`
            : ''
        }
        confirmButtonText="Entendido"
        onConfirm={() => setModalDuplicadoOpen(false)}
      />

      {/* Modal error de reconocimiento por foto */}
      <ModalAdvert
        isOpen={modalErrorFotoOpen}
        onClose={() => setModalErrorFotoOpen(false)}
        message={errorFotoMessage}
        confirmButtonText="Entendido"
        onConfirm={() => setModalErrorFotoOpen(false)}
      />
    </div>
  );
};

export default FormCrearProductoInline;
