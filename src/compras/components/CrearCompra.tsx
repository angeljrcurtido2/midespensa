'use client';

import { resaltarCampos } from '../../utils/camposInvalidos';
import AvisoCamposFaltantes, { type CampoFaltante } from '../../components/AvisoCamposFaltantes';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useRef } from 'react';
import FormCompra from './Compra/FormCompra';
import BuscadorProducto from '../../components/BuscadorProducto';
import DetallesProductos from './Compra/DetallesProductos';
import TotalCompra from './Compra/TotalCompra';
import PanelTotalCompra from './Compra/PanelTotalCompra';
import { VentanaActivaContext, useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import ModalSeleccionarProducto from './Modals/ModalSeleccionarProducto';
import ModalConfirmarProductos from './CompraRapida/ModalsCompraRapida/ModalConfirmarProductos';
import ModalComprobante from './CompraRapida/ModalsCompraRapida/ModalComprobante';
import { getConfiguracion, createCompra, getLotesProducto, subirImagenCompra } from '../../services/compras';
import { getProductosPaginated } from '../../services/productos';
import ModalSeleccionarLote from '../../ventas/components/ModalsVenta/ModalSeleccionarLote';
import ModalError from '../../components/ModalError';
import { FaSave, FaPlus, FaShoppingBasket, FaBoxOpen } from 'react-icons/fa';
import { usuarioTieneFacturadorActivo } from '../../services/facturador';
import FormCrearProductoInline from './Compra/FormCrearProductoInline';
import { GuiaTuki, BotonTuki, useGuiaTuki, type PasoGuia } from '../../components/guia/GuiaTuki';
interface CrearCompraProps {
  onClose?: () => void;
  onSuccess?: () => void;
  /** Pantalla completa (ventana propia) en lugar de ventana emergente. */
  pagina?: boolean;
}

const fechaActual = new Date();
const fechaParaguay = new Date(fechaActual.getTime() - fechaActual.getTimezoneOffset() * 60000)
  .toISOString()
  .split('T')[0];

const initialCompra = {
  idproveedor: '',
  nro_factura: '',
  fecha: fechaParaguay,
  tipo: 'contado',
  estado: 'pagado',
  descuento: 0,
  observacion: '',
  fecha_vencimiento: ''
};

const CrearCompra = ({ onSuccess, pagina = false }: CrearCompraProps) => {
  const navigate = useNavigate();
  const ventanaActiva = useContext(VentanaActivaContext);
  // Atajos de la pantalla completa: F2 busca producto, F9 registra la compra.
  useEffect(() => {
    if (!pagina || !ventanaActiva) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('buscador-compra')?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (detallesRef.current.length > 0) setConfirmModalOpen(true);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [pagina, ventanaActiva]);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [codigoBarrasBusqueda, setCodigoBarrasBusqueda] = useState('');
  const [buscandoCodigoBarras, setBuscandoCodigoBarras] = useState(false);
  const [errorCodigoBarras, setErrorCodigoBarras] = useState('');
  const [productoSearchInicial, setProductoSearchInicial] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [compra, setCompra] = useState(initialCompra);
  const [intentoRegistrar, setIntentoRegistrar] = useState(false);
  const [lotesProducto, setLotesProducto] = useState<any[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<any | null>(null);
  // La selección vive en su propia pestaña; al volver recuperamos el proveedor
  // sin desmontar ni perder el estado de la compra en curso.
  useAlVolverALaVentana(() => {
    const guardado = sessionStorage.getItem('compra:proveedor-seleccionado');
    if (!guardado) return;
    sessionStorage.removeItem('compra:proveedor-seleccionado');
    try {
      const proveedor = JSON.parse(guardado);
      setProveedorSeleccionado(proveedor);
      setCompra((prev) => ({ ...prev, idproveedor: proveedor.idproveedor }));
    } catch { /* Se descarta un valor incompleto y se conserva la compra. */ }
  });
  // En Nueva compra el catálogo es una pantalla propia (misma tabla que Productos); en el formulario antiguo sigue la ventana emergente.
  const abrirCatalogo = (busqueda = '') => {
    if (!pagina) { setProductoSearchInicial(busqueda); setShowProductoModal(true); return; }
    sessionStorage.setItem('catalogo:busqueda', busqueda);
    navigate('/compras/seleccionar-producto');
  };
  // Al volver de la pantalla del catálogo, se agrega el producto elegido sin perder la compra en curso.
  useAlVolverALaVentana(() => {
    const guardado = sessionStorage.getItem('compra:producto-seleccionado');
    if (!guardado) return;
    sessionStorage.removeItem('compra:producto-seleccionado');
    try { void handleSeleccionarProducto(JSON.parse(guardado)); } catch { /* valor incompleto: se descarta */ }
  });
  const [detalles, setDetalles] = useState<any[]>([]);
  // Guía paso a paso de Tuki para comprar (solo en la pantalla Nueva compra).
  const guiaCompra = useGuiaTuki('compra');
  const pasosGuiaCompra: PasoGuia[] = [
    { id: 'proveedor', destino: 'label:Proveedor', titulo: 'Elegí el proveedor', texto: 'Tocá Seleccionar y elegí a quién le comprás. Si todavía no lo cargaste, creálo desde Proveedores.', listo: !!proveedorSeleccionado },
    { id: 'factura', destino: 'label:Nro. Factura', titulo: 'Número de factura y forma de pago', texto: 'Escribí el número de la factura (o una referencia). Después elegí si es contado o crédito y cómo pagás. Si es tu stock inicial, escribí "Inventario inicial" en la observación.', listo: !!String(compra.nro_factura || '').trim() },
    { id: 'producto', destino: 'css:#buscador-compra', titulo: 'Agregá los productos', texto: 'Buscá el producto por nombre o código de barras. Si todavía no lo tenés, tocá Crear producto: Tuki también te guía ahí.', listo: detalles.length > 0 },
    { id: 'lote', destino: 'label:N° Lote', titulo: 'Lote, vencimiento y presentación', texto: 'Por cada producto escribí el número de lote (viene en la caja) y su fecha de vencimiento: así el sistema vende primero lo que vence antes. Elegí también cómo lo compraste: unidad, pack (por ejemplo blíster) o caja, y la cantidad.', listo: detalles.length > 0 && detalles.every((d: any) => String(d.numero_lote || '').trim()) },
    { id: 'registrar', destino: 'boton:Registrar compra', titulo: 'Registrá la compra', texto: 'Revisá el total y tocá Registrar compra (o F9). El stock sube solo y, si fue al contado, sale de la caja abierta.' },
  ];
  const detallesRef = useRef<any[]>([]);
  detallesRef.current = detalles;
  const [configCompraPorLote, setConfigCompraPorLote] = useState(false);
  const [total, setTotal] = useState(0);
  const [showCrearProducto, setShowCrearProducto] = useState(false);
  const [imagenComprobante, setImagenComprobante] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  const [comprobanteData, setComprobanteData] = useState({
    nro_factura: '',
    fecha: '',
    cantidadProductos: 0,
  });
  const [comprobanteProductos, setComprobanteProductos] = useState<any[]>([]);
  useEffect(() => { console.log(comprobanteProductos) }, [comprobanteProductos])
  useEffect(() => { console.log("Test", detalles) }, [detalles])
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await getConfiguracion();
        const configArray = res.data;

        const configCompraLote = configArray.find((c: any) => c.clave === 'sistema_venta_por_lote');
        const isCompraPorLote = configCompraLote?.valor === 'true';

        setConfigCompraPorLote(isCompraPorLote);
      } catch (error) {
        console.error('  Error al obtener configuración de compra:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const nuevoTotal = detalles.reduce((acc, d) => {
      const presentacion = d.presentacion_compra || (d.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD');
      const precioBase = Number(d.precio || 0);
      const precio = Number(d.precio_compra_presentacion || (presentacion === 'CAJA' ? Number(d.precio_compra_caja || 0) || precioBase * Number(d.cant_p_caja || 1) : presentacion === 'PACK' ? precioBase * Number(d.cant_p_pack || 1) : precioBase));
      const cantidad = parseFloat(d.cantidad || '0');
      return acc + (precio * cantidad);
    }, 0);
    setTotal(nuevoTotal);
  }, [detalles]);;

  /** Datos de la compra que faltan: proveedor, factura, fecha y el lote de cada producto. */
  const faltantesDeLaCompra = (): CampoFaltante[] => {
    const f: CampoFaltante[] = [];
    if (!compra.idproveedor) f.push({ clave: 'proveedor', etiqueta: 'Proveedor' });
    if (!String(compra.nro_factura || '').trim()) f.push({ clave: 'nro_factura', etiqueta: 'Nro. de factura' });
    if (!compra.fecha) f.push({ clave: 'fecha', etiqueta: 'Fecha' });
    return f;
  };
  const avisoFaltantes = intentoRegistrar ? faltantesDeLaCompra() : [];

  const handleSubmit = async () => {
    try {
      const tieneFacturadorActivo = await usuarioTieneFacturadorActivo();
      if (!tieneFacturadorActivo) {
        setErrorMessage('No tenes un facturador activo para tu usuario. No se puede registrar la compra.');
        setErrorModalOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error al validar facturador activo:', error);
      setErrorMessage('No se pudo validar el facturador activo del usuario.');
      setErrorModalOpen(true);
      return;
    }

    // Lo que falta se resalta en pantalla (con un aviso que no la tapa) en vez de un cartel que bloquea.
    setIntentoRegistrar(true);
    const pendientes = faltantesDeLaCompra();
    if (pendientes.length > 0) {
      resaltarCampos(pendientes.map((f) => f.clave));
      return;
    }

    const nuevosDescuadrados = detalles.filter((d) => Array.isArray(d.atributos_nuevos) && d.atributos_nuevos.length > 0 && d.atributos_nuevos.reduce((a: number, r: any) => a + Number(r.cantidad || 0), 0) !== (Number(d.cantidad) || 0) * (((d.presentacion_compra || (d.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD')) === 'CAJA' ? Number(d.cant_p_caja) : (d.presentacion_compra === 'PACK' ? Number(d.cant_p_pack) : 1)) || 1));
    if (nuevosDescuadrados.length > 0) {
      setErrorMessage(`Los atributos de ${nuevosDescuadrados.map((p) => p.nombre_producto).join(', ')} no suman las unidades que entran. Volvé a repartirlos.`);
      setErrorModalOpen(true);
      return;
    }

    const productosNuevos = detalles
      .filter((d) => String(d.idproducto).startsWith('temp-'))
      .map((d) => ({
        idtemp: d.idproducto,
        nombre_producto: d.nombre_producto,
        precio_compra: d.precio_compra || d.precio,
        precio_compra_caja: d.precio_compra_caja || null,
        precio_compra_presentacion: d.precio_compra_presentacion || null,
        precio_venta: d.precio_venta || '',
        precio_venta_caja: d.precio_venta_caja || null,
        precio_venta_pack: d.precio_venta_pack || null,
        cant_p_pack: d.cant_p_pack || null,
        oferta_cantidad: d.oferta_cantidad || null,
        oferta_precio: d.oferta_precio || null,
        unidad_medida: d.unidad_medida || '',
        iva: d.iva || '',
        idcategoria: d.idcategoria,
        idproveedor: compra.idproveedor,
        cantidad: d.cantidad,
        cant_p_caja: d.cant_p_caja || null,
        cant_cajas: d.cant_cajas || null,
        numero_lote: String(d.numero_lote || '').trim() || '01',
        referencia_proveedor: d.referencia_proveedor || '',
        cod_barra: d.cod_barra || null,
        ubicacion: d.ubicacion_almacen || 'PRINCIPAL',
        principio_activo: d.principio_activo || null,
        laboratorio: d.laboratorio || null,
        receta: d.receta || 'libre',
        stock_minimo: d.stock_minimo || null,
        atributos: Array.isArray(d.atributos_nuevos) && d.atributos_nuevos.length ? d.atributos_nuevos : null,
      }));
      
    const detallesFinales = detalles.map((d) => ({
      idproducto: d.idproducto,
      iddetalle: d.iddetalle || null,
      atributos: Array.isArray(d.atributos) && d.atributos.length ? d.atributos : null,
      idlote: d.idlote, //   CRÍTICO: Incluir idlote para actualizar lotes existentes
      cantidad: d.cantidad,
      precio: d.precio,
      presentacion_compra: d.presentacion_compra || (d.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD'),
      precio_compra_presentacion: d.precio_compra_presentacion || null,
      precio_venta_caja: d.precio_venta_caja || null,
      precio_venta_pack: d.precio_venta_pack || null,
      cant_p_pack: d.cant_p_pack || null,
      precio_compra_caja: d.precio_compra_caja || null,
      cant_p_caja: d.cant_p_caja || null,
      cant_cajas: d.cantidad,
      fecha_vencimiento: d.fecha_vencimiento || '',
      nombre_producto: d.nombre_producto,
      unidad_medida: d.unidad_medida,
      iva: d.iva,
      numero_lote: String(d.numero_lote || '').trim() || '01',
      referencia_proveedor: d.referencia_proveedor || '',
      ubicacion_almacen: d.ubicacion_almacen || 'PRINCIPAL'
    }));
    const payload = { compra: { ...compra, total }, detalles: detallesFinales, productosNuevos };

    try {
      const res = await createCompra(payload);
      const idcompra = res?.data?.idcompra;

      // Prueba rápida: si se seleccionó imagen, se sube después de creada la
      // compra. Es "best effort": si falla, no revertimos la compra ya creada,
      // solo avisamos.
      if (idcompra && imagenComprobante) {
        try {
          await subirImagenCompra(idcompra, imagenComprobante);
        } catch (imgError) {
          console.error('Error al subir la imagen del comprobante:', imgError);
        }
      }

      onSuccess && onSuccess();
      setComprobanteData({
        nro_factura: compra.nro_factura,
        fecha: compra.fecha,
        cantidadProductos: detalles.length,
      });
      setComprobanteProductos(
        detalles.map(({ precio, ...rest }) => ({
          ...rest,
          precio_compra: precio,
        }))
      );

      setSuccessModalOpen(true);
      setCompra(initialCompra);
      setProveedorSeleccionado(null);
      setDetalles([]);
      setImagenComprobante(null);
      setImagenPreview(null);
    } catch (error: any) {
      setErrorModalOpen(true)
      // Muestra el motivo que manda el servidor (por ejemplo, código de barras repetido) en lugar de un texto genérico.
      setErrorMessage(error?.response?.data?.error || error?.response?.data?.message || 'Error al registrar la compra');
    }
  };

  const handleSeleccionarProducto = async (producto: any) => {
    setProductoSearchInicial('');
          if (configCompraPorLote) {
            try {
              // Guardar información del producto seleccionado
              setProductoSeleccionado({
                idproducto: producto.idproducto,
                nombre_producto: producto.nombre_producto,
                precio_venta: producto.precio_venta,
                precio_compra: producto.precio_compra,
                unidad_medida: producto.unidad_medida,
                iva: producto.iva,
                precio_venta_caja: producto.precio_venta_caja,
                precio_venta_pack: producto.precio_venta_pack,
                cant_p_pack: producto.cant_p_pack,
                cant_p_caja: producto.cant_p_caja,
              });
              const res = await getLotesProducto(producto.idproducto);
              const lotes = res.data.lotes || [];
              setLotesProducto(lotes);
              setShowLoteModal(true);
              setShowProductoModal(false);
              console.log('🧾 Lotes disponibles:', lotes);
            } catch (error) {
              console.error('  Error al obtener lotes del producto:', error);
            }
          } else {
            const fechaVencimientoFormateada = producto.ultima_fecha_vencimiento
              ? new Date(producto.ultima_fecha_vencimiento).toISOString().split('T')[0]
              : '';

            setDetalles(prev => {
              console.log("Detalles antes de agregar:", prev);
              const idxExistente = prev.findIndex(d => d.idproducto === producto.idproducto);
              if (idxExistente !== -1) {
                const updated = [...prev];
                updated[idxExistente] = {
                  ...updated[idxExistente],
                  cantidad: (parseFloat(updated[idxExistente].cantidad || '0') + cantidadProducto).toString(),
                };
                return updated;
              } else {
                return [
                  ...prev,
                  {
                    idproducto: producto.idproducto,
                    nombre_producto: producto.nombre_producto,
                    cantidad: cantidadProducto,
                    precio_venta: producto.precio_venta || '',
                    precio_venta_caja: producto.precio_venta_caja || null,
                    precio_venta_pack: producto.precio_venta_pack || null,
                    cant_p_pack: producto.cant_p_pack || null,
                    precio: producto.precio_compra || '',
                    lote_pr_compr_rec: producto.lote_pr_compr_rec || '',
                    precio_compra_caja: producto.precio_compra_caja,
                    cant_p_caja: producto.cant_p_caja,
                    cant_cajas: cantidadProducto,
                    fecha_vencimiento: fechaVencimientoFormateada,
                    unidad_medida: producto.unidad_medida || '',
                    iva: producto.iva || '',
                    numero_lote: producto.lotenumreciente || '01',
                    referencia_proveedor: '',
                    ubicacion_almacen: 'PRINCIPAL',
                    presentacion_compra: 'UNIDAD',
                    precio_compra_presentacion: producto.precio_compra || ''
                  }
                ];
              }
            });

            setShowProductoModal(false);
          }

  };

  const buscarPorCodigoBarras = async () => {
    const codigo = codigoBarrasBusqueda.trim();
    if (!codigo) return;

    setBuscandoCodigoBarras(true);
    setErrorCodigoBarras('');
    try {
      const respuesta = await getProductosPaginated({ page: 1, limit: 100, search: codigo });
      const datos = respuesta.data;
      const productos = Array.isArray(datos) ? datos : (datos?.data || datos?.productos || []);
      const coincidenciasExactas = productos.filter(
        (producto: any) => String(producto.cod_barra ?? '').trim() === codigo
      );
      const coincidenciasParciales = productos.filter(
        (producto: any) => String(producto.cod_barra ?? '').trim().includes(codigo)
      );
      const coincidencias = coincidenciasExactas.length > 0
        ? coincidenciasExactas
        : coincidenciasParciales;

      if (coincidencias.length === 1) {
        await handleSeleccionarProducto(coincidencias[0]);
        setCodigoBarrasBusqueda('');
        return;
      }

      if (coincidencias.length > 1) {
        abrirCatalogo(codigo);
        return;
      }

      setErrorCodigoBarras('No se encontro un producto con ese codigo de barras.');
    } catch (error) {
      console.error('Error al buscar producto por codigo de barras:', error);
      setErrorCodigoBarras('No se pudo buscar el producto. Intenta nuevamente.');
    } finally {
      setBuscandoCodigoBarras(false);
    }
  };

  return (
    <div className={pagina ? "min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800" : "bg-white dark:bg-gray-800 overflow-x-clip"}>
      <form onSubmit={(e) => {
        e.preventDefault();
        setConfirmModalOpen(true);
      }} className='flex flex-row gap-5 w-full'>
        {/* min-w-0 (y no min-w-max): con min-w-max este contenedor se dimensionaba
            por su contenido (medido: 1339px) e ignoraba el viewport, así que a
            1280px la columna del resumen quedaba 59px fuera de pantalla. */}
        <div className="min-w-0 w-full">
          {pagina ? (
            <header
              className="flex flex-wrap items-center justify-between gap-3 bg-stone-800 px-5 py-4 text-white"
              style={{ borderBottom: '10px solid', borderImage: 'repeating-linear-gradient(90deg,#ea580c 0 26px,#44403c 26px 52px) 1' }}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <h1 className="flex items-center gap-3 text-2xl font-extrabold"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-600"><FaShoppingBasket aria-hidden="true" /></span>Recepción de mercadería</h1>
                <p className="text-sm text-stone-300"><kbd className="rounded-md bg-white/15 px-1.5 text-xs">F2</kbd> buscar producto · <kbd className="rounded-md bg-white/15 px-1.5 text-xs">F9</kbd> registrar compra</p>
              </div>
              <button type="button" onClick={() => navigate('/compras')} className="rounded-full border-2 border-white/50 px-5 py-2 text-sm font-bold text-white hover:bg-white/10">Ver compras anteriores</button>
            </header>
          ) : (
            <TotalCompra total={total} />
          )}
          <div className={pagina ? 'bg-slate-50 p-4 flex flex-row flex-wrap xl:flex-nowrap gap-4 dark:bg-slate-950' : 'p-2 pt-1 flex flex-row flex-wrap xl:flex-nowrap gap-3'}>

            {/* basis + min-w-0: la columna puede encogerse y, por debajo de xl,
                bajar a su propia fila en lugar de empujar el ancho total. */}
            <div className={pagina ? "order-2 flex min-w-0 flex-col space-y-2 rounded-md border border-blue-400/20 xl:max-h-[calc(100vh-8rem)] xl:w-[430px] xl:flex-none xl:overflow-hidden" : "space-y-2 border border-blue-400/20 rounded-md flex-1 basis-[500px] min-w-0"}>
              {pagina && <div className="shrink-0"><PanelTotalCompra total={total} cantidadLineas={detalles.length} /></div>}
              <div className={pagina ? "min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:#94a3b8_#e2e8f0] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-slate-100" : ""}>
                <div className={pagina ? "rounded-t-md bg-gradient-to-r from-blue-600 to-blue-700 p-3 dark:from-slate-800 dark:to-slate-700" : "rounded-t-md bg-gradient-to-r from-blue-600 to-blue-700 p-4 dark:from-slate-800 dark:to-slate-700"}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/20 p-2 dark:bg-white/10"><FaShoppingBasket className="text-white" size={pagina ? 20 : 24} /></div>
                    <div><h1 className={pagina ? "text-lg font-bold uppercase text-white" : "text-xl font-bold uppercase text-white"}>Nueva Compra</h1><p className={pagina ? "text-xs text-blue-100 dark:text-slate-300" : "text-sm text-blue-100 dark:text-slate-300"}>Registra una nueva compra de productos</p></div>
                  </div>
                </div>
                <AvisoCamposFaltantes faltantes={avisoFaltantes} className="mb-2" />
                <FormCompra pagina={pagina} compra={compra} setCompra={setCompra} proveedorSeleccionado={proveedorSeleccionado} openProveedorModal={() => navigate('/compras/seleccionar-proveedor')} />
                <div className="px-3 pb-3">
                  <label className="mb-1 block text-xs font-bold text-gray-600 dark:text-gray-300">Imagen del comprobante (opcional)</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => { const file = e.target.files?.[0] || null; setImagenComprobante(file); setImagenPreview(file ? URL.createObjectURL(file) : null); }} className="max-w-full text-xs text-gray-700 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white dark:text-gray-200" />
                    {imagenPreview && <div className="relative"><img src={imagenPreview} alt="Vista previa del comprobante" className={pagina ? "h-12 w-12 rounded-lg border object-cover" : "h-16 w-16 rounded-lg border border-gray-300 object-cover"} /><button type="button" onClick={() => { setImagenComprobante(null); setImagenPreview(null); }} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white" title="Quitar">x</button></div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Antes w-[540px] min-w-[540px]: 540px inamovibles que, sumados a la
                columna izquierda, no entraban en 1280px. basis menor que el de la
                columna del formulario para que éste no se comprima mientras el
                panel de detalle está vacío. */}
            <div className={pagina ? "order-1 flex min-w-0 flex-1 basis-[420px] flex-col gap-4" : "flex min-w-0 flex-1 basis-[420px] flex-col gap-4"}>
              {pagina && (
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[260px] flex-1"><BuscadorProducto modo="compra" onElegir={(producto) => { void handleSeleccionarProducto(producto); }} /></div>
                  <button type="button" onClick={() => abrirCatalogo()} className="flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-300"><FaPlus size={14} aria-hidden="true" />Ver cat{"\u00e1"}logo</button>
                  <button type="button" onClick={() => setShowCrearProducto((prev) => !prev)} className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"><FaBoxOpen size={14} aria-hidden="true" />{showCrearProducto ? 'Ocultar formulario' : 'Crear producto'}</button>
                </div>
              )}
              {showCrearProducto && (
                <FormCrearProductoInline
                  codigosPendientes={detalles.map((d: any) => String(d.cod_barra ?? '').trim()).filter(Boolean)}
                  onAgregar={(detalle) => {
                    setDetalles(prev => [...prev, detalle]);
                    setShowCrearProducto(false);
                  }}
                  onCancelar={() => setShowCrearProducto(false)}
                />
              )}
              <DetallesProductos
                detalles={detalles}
                setDetalles={setDetalles}
              />
            </div>



          </div>
          {/* Barra de acciones fija: siempre a la vista aunque se desplace la pantalla. */}
          <div data-testid="barra-acciones" className={pagina ? "hidden" : "sticky bottom-0 z-20 mt-1 border-t border-blue-200 bg-white/95 px-2 py-2 shadow-[0_-8px_16px_-10px_rgba(15,40,100,0.35)] backdrop-blur dark:border-gray-600 dark:bg-gray-800/95"}>
            <div className={pagina ? "mx-auto flex w-full max-w-7xl flex-wrap items-center justify-end gap-4" : "mx-auto w-full max-w-3xl"}>
              <div className={pagina ? "hidden" : "pb-2"}>
                <label htmlFor="compra-codigo-barras" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Agregar producto por codigo de barras</label>
                <div className="flex gap-2">
                  <input id="compra-codigo-barras" type="text" inputMode="numeric" autoComplete="off" maxLength={100} value={codigoBarrasBusqueda} onChange={(e) => { setCodigoBarrasBusqueda(e.target.value); setErrorCodigoBarras(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void buscarPorCodigoBarras(); } }} placeholder="Escanea o escribe el codigo de barras" className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                  <button type="button" onClick={() => void buscarPorCodigoBarras()} disabled={buscandoCodigoBarras || !codigoBarrasBusqueda.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{buscandoCodigoBarras ? 'Buscando...' : 'Buscar codigo'}</button>
                </div>
                {errorCodigoBarras && <p role="status" className="mt-1 text-sm text-red-600">{errorCodigoBarras}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {pagina && <button type="button" onClick={() => navigate('/compras')} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Ir al listado de compras</button>}
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white shadow hover:bg-blue-700"><FaSave size={16} />Registrar compra</button>
                <button onClick={() => { setProductoSearchInicial(''); setShowProductoModal(true); }} type="button" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"><FaPlus size={16} />Seleccionar producto</button>
                <button onClick={() => setShowCrearProducto((prev) => !prev)} type="button" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow transition-colors ${showCrearProducto ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'}`}><FaBoxOpen size={16} />{showCrearProducto ? 'Ocultar form' : 'Crear producto'}</button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {pagina && (
        <>
          {!guiaCompra.abierta && <BotonTuki nombre="la compra" invitar={guiaCompra.invitar} onAbrir={guiaCompra.abrir} onRechazar={guiaCompra.rechazarInvitacion} />}
          {guiaCompra.abierta && <GuiaTuki nombre="compra" pasos={pasosGuiaCompra} onCerrar={guiaCompra.cerrar} />}
        </>
      )}
      <ModalSeleccionarProducto
        isBuy={true}
        isOpen={showProductoModal}
        setCantidadProducto={setCantidadProducto}
        onClose={() => { setShowProductoModal(false); setProductoSearchInicial(''); }}
        initialSearch={productoSearchInicial}
        onSelect={handleSeleccionarProducto}
      />

      <ModalConfirmarProductos
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          setConfirmModalOpen(false);
          handleSubmit();
        }}
        productos={detalles}
      />
      <ModalSeleccionarLote
        isOpen={showLoteModal}
        onClose={() => setShowLoteModal(false)}
        lotes={lotesProducto}
        productoInfo={productoSeleccionado}
        onSelect={(loteSeleccionado) => {
          const fechaFormateada = loteSeleccionado.fecha_vencimiento
            ? new Date(loteSeleccionado.fecha_vencimiento).toISOString().split('T')[0]
            : '';

          const yaExiste = detalles.some(
            (detalle) => detalle.idlote === loteSeleccionado.idlote && loteSeleccionado.idlote !== -1
          );

          if (yaExiste) {
            const detallesActualizados = detalles.map((detalle) => {
              if (detalle.idlote === loteSeleccionado.idlote) {
                return {
                  ...detalle,
                  cantidad: detalle.cantidad + 1,
                };
              }
              return detalle;
            });

            setDetalles(detallesActualizados);
          } else {
            setDetalles((prev) => [
              ...prev,
              {
                idproducto: loteSeleccionado.idproducto,
                nombre_producto: loteSeleccionado.nombre_producto,
                cantidad: 1,
                precio: loteSeleccionado.precio_compra || '',
                precio_venta: loteSeleccionado.precio_venta || '',
                precio_venta_caja: loteSeleccionado.precio_venta_caja || null,
                precio_compra_caja: loteSeleccionado.precio_compra_caja || null,
                cant_p_caja: loteSeleccionado.cant_p_caja || null,
                fecha_vencimiento: fechaFormateada,
                unidad_medida: loteSeleccionado.unidad_medida,
                iva: loteSeleccionado.iva,
                idlote: loteSeleccionado.idlote,
                numero_lote: loteSeleccionado.numero_lote,
                referencia_proveedor: loteSeleccionado.referencia_proveedor || '',
                ubicacion_almacen: loteSeleccionado.ubicacion_almacen || 'PRINCIPAL',
              },
            ]);
          }

          setShowLoteModal(false);
        }}
      />
      <ModalComprobante
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        datos={comprobanteData}
        productos={comprobanteProductos}
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default CrearCompra;
