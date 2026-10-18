'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FormVenta from './CrearVenta/FormVenta';
import BuscadorProducto from '../../components/BuscadorProducto';
import PanelCobroVenta from './CrearVenta/PanelCobroVenta';
import { VentanaActivaContext, useAlVolverALaVentana } from '../../hooks/useAlVolverALaVentana';
import DetallesProductos from './CrearVenta/DetallesProductos';
import TotalVenta from './CrearVenta/TotalVenta';
import ModalSimuladorCuotas from './ModalsVenta/ModalSimuladorCuotas';
import ModalSeleccionarLote from './ModalsVenta/ModalSeleccionarLote';
import ModalAdvert from '../../components/ModalAdvert';
import ModalSeleccionarProducto from '../../compras/components/Modals/ModalSeleccionarProducto';
import ModalPresentacionVenta from './CrearVenta/ModalPresentacionVenta';
import ModalConversion from './ModalsVenta/ModalConversion';
import ModalSeleccionarCliente from './ModalsVenta/ModalSeleccionarCliente';
import ModalConfirmarProductos from '../../compras/components/CompraRapida/ModalsCompraRapida/ModalConfirmarProductos';
import ModalComprobante from '../../compras/components/CompraRapida/ModalsCompraRapida/ModalComprobante';
import ModalError from '../../components/ModalError';
import ModalVisualizarPDFs from './ModalsVenta/ModalVisualizarPDFs';
import { FaSave, FaPlus, FaShoppingCart } from 'react-icons/fa';
import type { TipoAjusteVenta } from './CrearVenta/TipoDescuento';
import { crearVenta, generarComprobanteConProgreso, obtenerConfiguracionVenta, validarVencimientoPorLote, validarVencimientoSimulado, obtenerLotesProducto } from '../../services/ventas';
import { usuarioTieneFacturadorActivo } from '../../services/facturador';
import { getProductosPaginated } from '../../services/productos';
import { camposPromoLinea } from '../../utils/promo';
import { descuentoOfertaDe } from '../../utils/oferta';
import { GuiaTuki, BotonTuki, useGuiaTuki, type PasoGuia } from '../../components/guia/GuiaTuki';

interface CrearVentaProps {
    onSuccess?: () => void;
    /** Pantalla completa (ventana propia) en lugar de ventana emergente. */
    pagina?: boolean;
}

const fechaActual = new Date();
const fechaParaguay = [
    fechaActual.getFullYear(),
    String(fechaActual.getMonth() + 1).padStart(2, '0'),
    String(fechaActual.getDate()).padStart(2, '0'),
].join('-');

const initialVenta = {
    idcliente: null,
    fecha: fechaParaguay,
    tipo: 'contado',
    tipo_comprobante: 'T',
    nro_factura: '',
    estado: 'pagado',
    total_descuento: 0,
    observacion: '',
    idformapago: 1,
    datos_bancarios: null,
    fecha_vencimiento: '',
    //   Campos de cuotas (solo para ventas a crédito)
    cant_cuota: 1,
    tasa_interes_anual: 0,
    dia_fecha_pago: 15
};

const CrearVenta = ({ onSuccess, pagina = false }: CrearVentaProps) => {
    const navigate = useNavigate();
    const ventanaActiva = useContext(VentanaActivaContext);
    // Atajos de teclado de la pantalla completa: F2 busca producto, F9 registra la venta.
    useEffect(() => {
        if (!pagina || !ventanaActiva) return;
        const alTeclear = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                document.getElementById('buscador-venta')?.focus();
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
    const [productoPresentacion, setProductoPresentacion] = useState<any>(null);
    const [presentacionPendiente, setPresentacionPendiente] = useState<'unidad' | 'pack' | 'caja'>('unidad');
    const [modalConversionUnidad, setModalConversionUnidad] = useState<'KG' | 'L' | null>(null);
    const [productoSearchInicial, setProductoSearchInicial] = useState('');

    // Medicamentos con receta o controlados: antes de agregarlos a la venta se recuerda pedir la receta (una vez por producto).
    const [recetaPendiente, setRecetaPendiente] = useState<{ producto: any; presentacion: 'unidad' | 'pack' | 'caja'; cantidad: number } | null>(null);
    const recetasConfirmadas = useRef<Set<number>>(new Set());

    const [advertModalOpen, setAdvertModalOpen] = useState(false);
    const [advertMessage, setAdvertMessage] = useState('');
    const [tipoDescuento, setTipoDescuento] = useState<TipoAjusteVenta>('sin_descuento')
    const [montoDescuentoTotal, setMontoDescuentoTotal] = useState("")
    const [montoRecargoTotal, setMontoRecargoTotal] = useState("")
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [showLoteModal, setShowLoteModal] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorProductos, setErrorProductos] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [cantidadProducto, setCantidadProducto] = useState(1);
    const [cantidadMaximo, setCantidadMaximo] = useState(0);
    const [configVentaPorLote, setConfigVentaPorLote] = useState<boolean>(false);
    const [configventaFechaVencimiento, setConfigVentaFechaVencimiento] = useState<boolean>(false);
    const [lotesProducto, setLotesProducto] = useState<any[]>([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
    const [venta, setVenta] = useState(initialVenta);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any | null>(null);
    const [detalles, setDetalles] = useState<any[]>([]);
    // Guía paso a paso de Tuki para vender (solo en la pantalla Nueva venta).
    const guiaVenta = useGuiaTuki('venta');
    const pasosGuiaVenta: PasoGuia[] = [
        { id: 'buscar', destino: 'css:#buscador-venta', titulo: 'Buscá el producto', texto: 'Escribí el nombre o escaneá el código de barras (también podés usar la cámara del celular). Después tocá el botón azul de cómo lo vendés: unidad, pack o caja.', listo: detalles.length > 0 },
        { id: 'lineas', destino: 'css:table', titulo: 'Revisá cantidad y precio', texto: 'Acá ves lo que se lleva el cliente. Podés cambiar la cantidad y el precio de cada producto; si tiene una oferta, el sistema la aplica solo.' },
        ...(configVentaPorLote ? [{ id: 'lote', titulo: 'Elegí el lote', texto: 'Tu sistema vende por lote: al agregar el producto te pregunta de qué lote sale. Conviene elegir el que vence primero.' }] : []),
        { id: 'cliente', destino: 'label:Cliente opcional', titulo: '¿Para quién es? (opcional)', texto: 'Si no elegís cliente, la venta queda a nombre de un cliente general. Elegilo si es a crédito o si querés guardar sus compras.', listo: !!clienteSeleccionado },
        { id: 'tipo', destino: 'label:Tipo de Venta', titulo: 'Contado o crédito', texto: 'Contado: el cliente paga ahora. Crédito: se arman las cuotas y queda una deuda por cobrar.' },
        { id: 'recibido', destino: 'label:Recibido', titulo: 'Cuánto paga el cliente', texto: 'Escribí lo que recibís y el sistema te muestra el vuelto.' },
        { id: 'registrar', destino: 'boton:Registrar venta', titulo: 'Registrá la venta', texto: 'Cuando esté todo bien, tocá Registrar venta (o la tecla F9) y confirmá. El stock baja solo y podés dar el ticket.' },
    ];
    const detallesRef = useRef<any[]>([]);
    detallesRef.current = detalles;
    const [total, setTotal] = useState(0);
    // Oferta por cantidad ("3 por 10.000") de todas las líneas; el servidor la recalcula al guardar.
    const ofertaTotal = detalles.reduce((acc, d) => acc + descuentoOfertaDe(d), 0);
    const [showSimuladorCuotas, setShowSimuladorCuotas] = useState(false);

    // Estados para el modal de visualización de PDFs
    const [showPDFsModal, setShowPDFsModal] = useState(false);
    const [facturaPDFBase64, setFacturaPDFBase64] = useState<string | null>(null);
    const [pagarePDFBase64, setPagarePDFBase64] = useState<string | null>(null);
    const [ventaComprobanteId, setVentaComprobanteId] = useState<number | null>(null);
    const [progresoComprobante, setProgresoComprobante] = useState<{ porcentaje: number; mensaje: string; segundos: number } | null>(null);

    useEffect(() => {
        const fetchConfiguraciones = async () => {
            try {
                const config = await obtenerConfiguracionVenta();
                setConfigVentaPorLote(config.sistema_venta_por_lote);
                setConfigVentaFechaVencimiento(config.venta_fecha_vencimiento);
            } catch (error) {
                console.error('  Error al cargar configuraciones', error);
            }
        };

        fetchConfiguraciones();
    }, []);

    const [comprobanteData, setComprobanteData] = useState({
        nro_factura: '',
        fecha: '',
        cantidadProductos: 0,
        totalFinal: 0,
        tipoAjuste: 'sin_descuento',
        montoDescuento: 0,
        montoRecargo: 0,
    });
    const [comprobanteProductos, setComprobanteProductos] = useState<any[]>([]);

    const abrirPresentaciones = (producto: any) => {
        setShowProductoModal(false);
        setProductoSearchInicial('');
        if (!producto) return;
        const unidad = String(producto.unidad_medida || '').toUpperCase();
        const tieneCaja = unidad === 'CAJA' && Number(producto.cant_p_caja) > 0;
        const tienePack = Number(producto.cant_p_pack) > 0;
        const esMedible = ['KG', 'L', 'LITRO'].includes(unidad);
        if (tieneCaja || tienePack || esMedible) setProductoPresentacion(producto);
        else void agregarProductoConPresentacion(producto, 'unidad');
    };

    // En Nueva venta el catálogo es una pantalla propia (misma tabla que Productos); en el formulario antiguo sigue la ventana emergente.
    const abrirCatalogo = (busqueda = '') => {
        if (!pagina) { setProductoSearchInicial(busqueda); setShowProductoModal(true); return; }
        sessionStorage.setItem('catalogo:busqueda', busqueda);
        navigate('/ventas/seleccionar-producto');
    };
    // Al volver de la pantalla del catálogo, se agrega el producto elegido sin perder la venta en curso.
    useAlVolverALaVentana(() => {
        const guardado = sessionStorage.getItem('venta:producto-seleccionado');
        if (!guardado) return;
        sessionStorage.removeItem('venta:producto-seleccionado');
        try { abrirPresentaciones(JSON.parse(guardado)); } catch { /* valor incompleto: se descarta */ }
    });

    const buscarProductoPorCodigo = async () => {
        const codigo = codigoBarrasBusqueda.trim();
        if (!codigo) return;
        setBuscandoCodigoBarras(true);
        setErrorCodigoBarras('');
        try {
            const respuesta = await getProductosPaginated({ page: 1, limit: 100, search: codigo, para_venta: 1 });
            const body = respuesta.data;
            const lista = Array.isArray(body) ? body : (body?.data || body?.productos || []);
            const coincidencias = lista.filter((p: any) => String(p.cod_barra ?? '').trim() === codigo);
            if (coincidencias.length === 1) abrirPresentaciones(coincidencias[0]);
            else if (coincidencias.length > 1) { abrirCatalogo(codigo); }
            else setErrorCodigoBarras('No se encontró un producto con ese código de barras.');
        } catch (error) {
            console.error('Error buscando el código de barras:', error);
            setErrorCodigoBarras('No se pudo buscar el producto. Intenta nuevamente.');
        } finally { setBuscandoCodigoBarras(false); }
    };

    const agregarProductoConPresentacion = async (producto: any, presentacion: 'unidad' | 'pack' | 'caja', cantidad = 1) => {
        if (!producto) return;
        const pideReceta = producto.receta === 'receta' || producto.receta === 'controlado';
        if (pideReceta && !recetasConfirmadas.current.has(producto.idproducto) && !detalles.some((d) => d.idproducto === producto.idproducto)) {
            setProductoPresentacion(null);
            setRecetaPendiente({ producto, presentacion, cantidad });
            return;
        }
        setPresentacionPendiente(presentacion);
        setCantidadProducto(cantidad);
        if (configVentaPorLote) {
            try {
                setProductoSeleccionado(producto);
                const res = await obtenerLotesProducto(producto.idproducto);
                setLotesProducto(res.data.lotes || []);
                setShowLoteModal(true);
                setProductoPresentacion(null);
            } catch (error) {
                console.error('Error al obtener lotes del producto:', error);
            }
            return;
        }

        const unidadesCaja = Number(producto.cant_p_caja) || 0;
        const unidadesPack = Number(producto.cant_p_pack) || 0;
        setDetalles((prev) => {
            const index = prev.findIndex((d) => d.idproducto === producto.idproducto);
            const actual = index >= 0 ? prev[index] : {
                idproducto: producto.idproducto, nombre_producto: producto.nombre_producto,
                precio_venta: Number(producto.precio_venta) || 0,
                precio_venta_caja: Number(producto.precio_venta_caja) || 0,
                precio_venta_pack: Number(producto.precio_venta_pack) || 0,
                cant_p_caja: producto.cant_p_caja || 0, cant_p_pack: producto.cant_p_pack || 0,
                cant_cajas_vender: 0, cant_packs_vender: 0, cant_unidades_sueltas: 0, cantidad: 0,
                precio_compra: producto.lote_pr_compr_rec || producto.precio_compra || 0,
                unidad_medida: producto.unidad_medida || 'UNIDAD', iva: producto.iva || 0,
                fecha_vencimiento: producto.ultima_fecha_vencimiento ? new Date(producto.ultima_fecha_vencimiento).toISOString().slice(0, 10) : '',
                numero_lote: producto.lotenumreciente || null, descuento: 0,
                ...camposPromoLinea(producto),
            };
            const next = { ...actual };
            if (presentacion === 'caja') next.cant_cajas_vender = Number(next.cant_cajas_vender || 0) + 1;
            else if (presentacion === 'pack') next.cant_packs_vender = Number(next.cant_packs_vender || 0) + 1;
            else next.cant_unidades_sueltas = Number(next.cant_unidades_sueltas || 0) + cantidad;
            next.cantidad = Number(next.cant_cajas_vender || 0) * unidadesCaja + Number(next.cant_packs_vender || 0) * unidadesPack + Number(next.cant_unidades_sueltas || 0);
            if (index < 0) return [...prev, next];
            const copy = [...prev]; copy[index] = next; return copy;
        });
        setProductoPresentacion(null);
        setCodigoBarrasBusqueda('');
        setErrorCodigoBarras('');
    };

    useEffect(() => {
        const nuevoTotal = detalles.reduce((acc, d) => {
            const cantidad = Number(d.cantidad || 0);
            const packs = Number(d.cant_packs_vender || 0);
            const subtotal = d.unidad_medida === 'CAJA'
                ? Number(d.cant_cajas_vender || 0) * Number(d.precio_venta_caja || 0) + packs * Number(d.precio_venta_pack || 0) + Number(d.cant_unidades_sueltas || 0) * Number(d.precio_venta || 0)
                : packs * Number(d.precio_venta_pack || 0) + Math.max(cantidad - packs * Number(d.cant_p_pack || 0), 0) * Number(d.precio_venta || 0);
            return acc + subtotal;
        }, 0);
        if (tipoDescuento === 'descuento_producto') setMontoDescuentoTotal(String(detalles.reduce((acc, d) => acc + (Number(d.descuento) || 0), 0)));
        if (tipoDescuento === 'recargo_producto') setMontoRecargoTotal(String(detalles.reduce((acc, d) => acc + (Number(d.recargo) || 0), 0)));
        setTotal(nuevoTotal);
    }, [detalles, tipoDescuento]);

    const handleSubmit = async () => {
        try {
            const tieneFacturadorActivo = await usuarioTieneFacturadorActivo();
            if (!tieneFacturadorActivo) {
                setErrorMessage('No tenes un facturador activo para tu usuario. No se puede registrar la venta.');
                setErrorProductos([]);
                setErrorModalOpen(true);
                return;
            }
        } catch (error) {
            console.error('Error al validar facturador activo:', error);
            setErrorMessage('No se pudo validar el facturador activo del usuario.');
            setErrorProductos([]);
            setErrorModalOpen(true);
            return;
        }

        if (venta.idformapago === 2 && !venta.datos_bancarios) {
            setAdvertMessage('⚠️ Debes seleccionar los datos bancarios para realizar la venta con transferencia.');
            setAdvertModalOpen(true);
            return;
        }

        if (!venta.fecha) {
            setErrorMessage('La fecha de la venta es obligatoria.');
            setErrorProductos([]);
            setErrorModalOpen(true);
            return;
        }

        if (!venta.tipo) {
            setErrorMessage('Debes seleccionar el tipo de pago.');
            setErrorProductos([]);
            setErrorModalOpen(true);
            return;
        }

        if (!venta.tipo_comprobante) {
            setErrorMessage('Debes seleccionar el tipo de comprobante.');
            setErrorProductos([]);
            setErrorModalOpen(true);
            return;
        }

        const detallesFinales = detalles.map((d) => ({
            idproducto: d.idproducto,
            idlote: d.idlote,
            cantidad: d.cantidad,
            descuento: d.descuento,
            recargo: d.recargo,
            precio_venta: d.precio_venta,
            precio_compra: d.precio_compra,
            fecha_vencimiento: d.fecha_vencimiento || '',
            nombre_producto: d.nombre_producto,
            unidad_medida: d.unidad_medida,
            iva: d.iva,
            precio_venta_caja: d.precio_venta_caja || null,
            cant_p_caja: d.cant_p_caja || null,
            cant_cajas_vender: d.cant_cajas_vender || null,
            cant_unidades_sueltas: d.cant_unidades_sueltas || null,
            precio_venta_pack: d.precio_venta_pack || null,
            cant_p_pack: d.cant_p_pack || null,
            cant_packs_vender: d.cant_packs_vender || null,
            //   Incluir detalle del producto (atributos)
            atributos: Array.isArray(d.atributos) && d.atributos.length ? d.atributos : null,
        }));

        const idcliente = venta.idcliente ? Number(venta.idcliente) : null;

        const payload = {
            venta: { ...venta, idcliente, total, total_descuento: tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0, total_recargo: tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0, tipo_comprobante: 'T' },
            detalles: detallesFinales,
            sistema_venta_por_lote: configVentaPorLote,
            tipoDescuento
        };

        try {
            if (configVentaPorLote && configventaFechaVencimiento) {
                const res = await validarVencimientoPorLote(detallesFinales);
                if (res.data?.error) {
                    const productosConError = res.data.productos_vencidos.map((prod: any) => ({
                        nombre_producto: prod.nombre_producto,
                        error: `Producto vencido - Fecha: ${new Date(prod.fecha_vencimiento).toLocaleDateString()}`,
                    }));

                    setErrorMessage("Hay productos vencidos en los lotes seleccionados.");
                    setErrorProductos(productosConError);
                    setErrorModalOpen(true);
                    return;
                }
            } else if (!configVentaPorLote && configventaFechaVencimiento) {

                const res = await validarVencimientoSimulado(
                    detalles.map((d) => ({
                        idproducto: d.idproducto,
                        cantidad: d.cantidad,
                    }))
                );

                if (res.data?.error) {
                    const productosConError = res.data.productos_vencidos.map((prod: any) => ({
                        nombre_producto: prod.nombre_producto,
                        error: `Producto vencido - Solo se pueden vender ${prod.cantidadDisponible} (vencen: ${new Date(prod.vencidos[0].fecha_vencimiento).toLocaleDateString()})`,
                    }));

                    setErrorMessage("Algunos productos tienen lotes vencidos y no se puede procesar la venta completa.");
                    setErrorProductos(productosConError);
                    console.log("Productos con error", productosConError)
                    setErrorModalOpen(true);
                    return;
                }
            }
            const response = await crearVenta(payload);
            onSuccess && onSuccess();
            setVentaComprobanteId(Number(response.data?.idventa) || null);

            // Guardar PDFs en el estado y abrir modal
            if (response.data?.facturaPDFBase64 || response.data?.pagarePDFBase64) {
                setFacturaPDFBase64(response.data.facturaPDFBase64 || null);
                setPagarePDFBase64(response.data.pagarePDFBase64 || null);
                setShowPDFsModal(true);
            }

            setComprobanteData({
                nro_factura: response.data?.nro_factura || '',
                fecha: venta.fecha,
                cantidadProductos: detalles.length,
                totalFinal: Number(response.data?.total_final ?? (total - (tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) - ofertaTotal + (tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0))),
                tipoAjuste: ofertaTotal > 0 && tipoDescuento === 'sin_descuento' ? 'descuento_producto' : tipoDescuento,
                montoDescuento: Number(response.data?.total_descuento ?? ((tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) + ofertaTotal)),
                montoRecargo: tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0,
            });

            setComprobanteProductos(detalles.map((d) => ({
                ...d,
                precio_venta: d.precio_venta,
            })));

            setSuccessModalOpen(true);
            setMontoDescuentoTotal("");
            setMontoRecargoTotal("");
            setTipoDescuento('sin_descuento');
            setVenta(initialVenta);
            setClienteSeleccionado(null);
            setDetalles([]);

        } catch (error: any) {
            const errorMessage = error.response.data.error || 'Error al registrar la venta';
            setErrorMessage(errorMessage);
            setErrorProductos([]);
            setErrorModalOpen(true);
        }
    };

    return (
        <div className={pagina ? "min-h-[calc(100vh-4rem)] bg-white dark:bg-slate-900" : "bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-x-clip"}>
            {pagina ? (
            <form onSubmit={(e) => {
                e.preventDefault();
                if (detalles.length > 0) setConfirmModalOpen(true);
            }} className="flex min-h-[calc(100vh-4rem)] flex-col">
                <header
                    className="flex flex-wrap items-center justify-between gap-3 bg-orange-700 px-5 py-4 text-white"
                    style={{ borderBottom: '10px solid', borderImage: 'repeating-linear-gradient(90deg,#9a3412 0 26px,#fff7ed 26px 52px) 1' }}
                >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <h1 className="flex items-center gap-3 text-2xl font-extrabold"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20"><FaShoppingCart aria-hidden="true" /></span>Mostrador</h1>
                        <p className="text-sm text-orange-100"><kbd className="rounded-md bg-black/20 px-1.5 text-xs">F2</kbd> buscar producto · <kbd className="rounded-md bg-black/20 px-1.5 text-xs">F9</kbd> cobrar</p>
                    </div>
                    <button type="button" onClick={() => navigate('/ventas')} className="rounded-full border-2 border-white/60 px-5 py-2 text-sm font-bold text-white hover:bg-white/15">Ver ventas anteriores</button>
                </header>
                <div className="grid flex-1 items-start gap-4 bg-slate-50 p-4 dark:bg-slate-950 lg:grid-cols-[minmax(0,1fr)_410px]">
                    <section className="flex min-w-0 flex-col gap-3">
                        <div className="flex flex-wrap items-start gap-3">
                            <div className="min-w-[260px] flex-1">
                                <BuscadorProducto
                                    modo="venta"
                                    onElegir={(producto, presentacion) => {
                                        if (presentacion === 'elegir') abrirPresentaciones(producto);
                                        else void agregarProductoConPresentacion(producto, presentacion);
                                    }}
                                />
                            </div>
                            <button type="button" onClick={() => abrirCatalogo()} className="flex items-center gap-2 rounded-xl border-2 border-blue-300 bg-white px-4 py-3 font-semibold text-blue-700 hover:bg-blue-50 dark:bg-slate-800 dark:text-blue-300">
                                <FaPlus size={14} aria-hidden="true" />Ver catálogo
                            </button>
                        </div>
                        <DetallesProductos
                            pagina
                            tipoDescuento={tipoDescuento}
                            setCantidadProducto={setCantidadProducto}
                            detalles={detalles}
                            setDetalles={setDetalles}
                        />
                    </section>
                    <aside className="flex flex-col gap-3 lg:sticky lg:top-14">
                        <PanelCobroVenta
                            subtotal={total}
                            descuento={(tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) + ofertaTotal}
                            recargo={tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0}
                            cantidadLineas={detalles.length}
                        />
                        <FormVenta
                            pagina
                            setMontoDescuentoTotal={setMontoDescuentoTotal}
                            montoDescuentoTotal={montoDescuentoTotal}
                            setMontoRecargoTotal={setMontoRecargoTotal}
                            montoRecargoTotal={montoRecargoTotal}
                            setTipoDescuento={setTipoDescuento}
                            tipoDescuento={tipoDescuento}
                            venta={venta}
                            setVenta={setVenta}
                            clienteSeleccionado={clienteSeleccionado}
                            openClienteModal={() => setShowClienteModal(true)}
                            openSimuladorCuotas={() => setShowSimuladorCuotas(true)}
                            totalVenta={total - (tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) - ofertaTotal + (tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0)}
                        />
                    </aside>
                </div>
            </form>
            ) : (
            <form onSubmit={(e) => {
                e.preventDefault();
                setConfirmModalOpen(true);
            }} className={pagina ? 'flex flex-col' : 'flex flex-row gap-5'}>
                <div className={pagina ? "min-w-0" : undefined}>
                    <TotalVenta total={total} descuento_total={(tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) + ofertaTotal} recargo_total={tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0} />
                    <div className={pagina ? 'grid items-start gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(400px,470px)]' : 'p-2 flex flex-row gap-3'}>         
                        <div className={pagina ? "space-y-2 rounded-md border border-blue-400/20 lg:order-2" : "space-y-2 border border-blue-400/20 rounded-md"}>
                            <div className="dark:bg-gray-600 bg-blue-500 rounded-t-md p-4">
                                <div className="flex items-center gap-3">
                                    <div className="dark:bg-gray-600 bg-white/20 p-2 rounded-lg">
                                        <FaShoppingCart className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-white uppercase">Nueva Venta</h1>
                                        <p className="text-sm text-blue-100">Registrá una nueva venta al sistema</p>
                                    </div>
                                </div>
                            </div>
                            <FormVenta
                                pagina={pagina}
                                setMontoDescuentoTotal={setMontoDescuentoTotal}
                                montoDescuentoTotal={montoDescuentoTotal}
                                setMontoRecargoTotal={setMontoRecargoTotal}
                                montoRecargoTotal={montoRecargoTotal}
                                setTipoDescuento={setTipoDescuento}
                                tipoDescuento={tipoDescuento}
                                venta={venta}
                                setVenta={setVenta}
                                clienteSeleccionado={clienteSeleccionado}
                                openClienteModal={() => setShowClienteModal(true)}
                                openSimuladorCuotas={() => setShowSimuladorCuotas(true)}
                                totalVenta={total - (tipoDescuento.startsWith('descuento_') ? Number(montoDescuentoTotal) || 0 : 0) - ofertaTotal + (tipoDescuento.startsWith('recargo_') ? Number(montoRecargoTotal) || 0 : 0)}
                            />
                        </div>

                        <div className={pagina ? "flex min-w-0 flex-col gap-3 lg:order-1" : "flex flex-col w-[520px]"}>
                            {pagina && (
                                <BuscadorProducto
                                    modo="venta"
                                    onElegir={(producto, presentacion) => {
                                        if (presentacion === 'elegir') abrirPresentaciones(producto);
                                        else void agregarProductoConPresentacion(producto, presentacion);
                                    }}
                                />
                            )}
                            <DetallesProductos
                                pagina={pagina}
                                tipoDescuento={tipoDescuento}
                                setCantidadProducto={setCantidadProducto}
                                detalles={detalles}
                                setDetalles={setDetalles}
                            />
                        </div>
                        

                    </div>
                    {/* Barra de acciones fija: siempre a la vista aunque se desplace la pantalla. */}
                    <div data-testid="barra-acciones" className="sticky bottom-0 z-20 mt-1 border-t border-blue-200 bg-white/95 px-2 py-2 shadow-[0_-8px_16px_-10px_rgba(15,40,100,0.35)] backdrop-blur dark:border-gray-600 dark:bg-gray-800/95">
                        <div className={pagina ? "mx-auto flex w-full max-w-7xl flex-wrap items-center justify-end gap-4" : "mx-auto w-full max-w-3xl"}>
                            <div className={pagina ? "hidden" : "pb-2"}>
                                <label htmlFor="venta-codigo-barras" className="mb-1 block text-sm font-medium">Agregar producto por código de barras</label>
                                <div className="flex gap-2">
                                    <input id="venta-codigo-barras" value={codigoBarrasBusqueda} onChange={(e) => setCodigoBarrasBusqueda(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void buscarProductoPorCodigo(); } }} className="min-w-0 flex-1 rounded-lg border px-3 py-2" placeholder="Escanea o escribe el código" inputMode="numeric" />
                                    <button type="button" onClick={() => void buscarProductoPorCodigo()} disabled={buscandoCodigoBarras} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{buscandoCodigoBarras ? 'Buscando…' : 'Buscar'}</button>
                                </div>
                                {errorCodigoBarras && <p role="alert" className="mt-1 text-sm text-red-600">{errorCodigoBarras}</p>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {pagina && (
                                    <button type="button" onClick={() => navigate('/ventas')} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
                                        Ir al listado de ventas
                                    </button>
                                )}
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2">
                                    <FaSave size={16} />
                                    Registrar venta
                                </button>
                                <button onClick={() => setShowProductoModal(true)} type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
                                    <FaPlus size={16} />
                                    Seleccionar producto
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

            </form>
            )}

            {pagina && (
                <>
                    {!guiaVenta.abierta && <BotonTuki nombre="la venta" invitar={guiaVenta.invitar} onAbrir={guiaVenta.abrir} onRechazar={guiaVenta.rechazarInvitacion} />}
                    {guiaVenta.abierta && <GuiaTuki nombre="venta" pasos={pasosGuiaVenta} onCerrar={guiaVenta.cerrar} />}
                </>
            )}
            <ModalSeleccionarProducto
                isBuy={false}
                isOpen={showProductoModal}
                detalles={detalles}
                configVentaPorLote={configVentaPorLote}
                cantidadProducto={cantidadProducto}
                stockVerify={true}
                setCantidadMaximo={setCantidadMaximo}
                setCantidadProducto={setCantidadProducto}
                onClose={() => { setShowProductoModal(false); setProductoSearchInicial(''); }}
                initialSearch={productoSearchInicial}
                onSelect={async (producto) => {
                    abrirPresentaciones(producto);
                    return;
                    if (configVentaPorLote) {
                        try {
                            // Guardar información del producto seleccionado
                            setProductoSeleccionado({
                                idproducto: producto.idproducto,
                                nombre_producto: producto.nombre_producto,
                                precio_venta: producto.precio_venta,
                                precio_compra: producto.lote_pr_compr_rec,
                                unidad_medida: producto.unidad_medida,
                                iva: producto.iva,
                                precio_venta_caja: producto.precio_venta_caja,
                                precio_venta_pack: producto.precio_venta_pack,
                                cant_p_pack: producto.cant_p_pack,
                                cant_p_caja: producto.cant_p_caja,
                            });
                            const res = await obtenerLotesProducto(producto.idproducto);
                            const lotes = res.data.lotes || [];
                            setLotesProducto(lotes);
                            setShowLoteModal(true);
                            setShowProductoModal(false)
                        } catch (error) {
                            console.error('  Error al obtener lotes del producto:', error);
                        }
                    } else {
                        const fechaVencimientoFormateada = producto.ultima_fecha_vencimiento
                            ? new Date(producto.ultima_fecha_vencimiento).toISOString().split('T')[0]
                            : '';

                        setDetalles(prev => {
                            const idxExistente = prev.findIndex(d => d.idproducto === producto.idproducto);

                            if (idxExistente !== -1) {
                                const updated = [...prev];

                                //   Para productos CAJA, sumar cajas en lugar de cantidad directa
                                if (producto.unidad_medida === 'CAJA') {
                                    const cajasActuales = parseFloat(updated[idxExistente].cant_cajas_vender || '0');
                                    const cantidadAAgregar = cantidadProducto || 1;
                                    updated[idxExistente].cant_cajas_vender = cajasActuales + cantidadAAgregar;

                                    // Recalcular cantidad total
                                    const cajasVender = parseFloat(updated[idxExistente].cant_cajas_vender || '0');
                                    const unidadesSueltas = parseFloat(updated[idxExistente].cant_unidades_sueltas || '0');
                                    const cantPorCaja = parseFloat(updated[idxExistente].cant_p_caja || '0');
                                    const cantidadPacks = parseFloat(updated[idxExistente].cant_packs_vender || '0') * parseFloat(updated[idxExistente].cant_p_pack || '0');
                                    updated[idxExistente].cantidad = (cajasVender * cantPorCaja) + cantidadPacks + unidadesSueltas;
                                } else {
                                    updated[idxExistente].cantidad = (
                                        parseFloat(updated[idxExistente].cantidad || '0') +
                                        parseFloat(producto.cantidad || '0')
                                    ).toString();
                                }

                                return updated;
                            } else {
                                //   Nuevo producto: inicializar campos según tipo
                                const nuevoDetalle: any = {
                                    idproducto: producto.idproducto,
                                    nombre_producto: producto.nombre_producto,
                                    cantidadMaximo: producto.cantidadMaximo || cantidadMaximo,
                                    precio_venta: producto.precio_venta || '',
                                    precio_compra: producto.lote_pr_compr_rec || '',
                                    fecha_vencimiento: fechaVencimientoFormateada,
                                    unidad_medida: producto.unidad_medida || '',
                                    iva: producto.iva || '',
                                    descuento: 0,
                                    // Usar lotenumreciente del producto como numero_lote
                                    numero_lote: producto.lotenumreciente || null,
                                    precio_venta_pack: producto.precio_venta_pack || 0,
                                    cant_p_pack: producto.cant_p_pack || 0,
                                    cant_packs_vender: 0,
                                };

                                //   Si es producto tipo CAJA, agregar campos específicos
                                if (producto.unidad_medida === 'CAJA') {
                                    // Usar la cantidad ingresada por el usuario (cantidadProducto) o 1 por defecto
                                    const cajasIniciales = cantidadProducto || 1;
                                    nuevoDetalle.cant_cajas_vender = cajasIniciales;
                                    nuevoDetalle.cant_unidades_sueltas = 0;
                                    nuevoDetalle.cant_p_caja = producto.cant_p_caja || 0;
                                    nuevoDetalle.precio_venta_caja = producto.precio_venta_caja || 0;
                                    nuevoDetalle.precio_venta_pack = producto.precio_venta_pack || 0;
                                    nuevoDetalle.cant_p_pack = producto.cant_p_pack || 0;
                                    nuevoDetalle.cant_packs_vender = 0;
                                    // Calcular la cantidad total de unidades
                                    const cantPorCaja = parseFloat(producto.cant_p_caja || '0');
                                    nuevoDetalle.cantidad = cajasIniciales * cantPorCaja;
                                } else {
                                    nuevoDetalle.cantidad = producto.cantidad || 1;
                                }

                                return [...prev, nuevoDetalle];
                            }
                        });

                        setShowProductoModal(false);
                    }
                }}
            />

            <ModalPresentacionVenta
                producto={productoPresentacion}
                onClose={() => setProductoPresentacion(null)}
                onSelect={(presentacion) => {
                    if (presentacion === 'gramos' || presentacion === 'mililitros') {
                        setModalConversionUnidad(presentacion === 'gramos' ? 'KG' : 'L');
                        return;
                    }
                    void agregarProductoConPresentacion(productoPresentacion, presentacion);
                }}
            />

            <ModalConversion
                isOpen={modalConversionUnidad !== null}
                unidadMedida={modalConversionUnidad || 'KG'}
                onClose={() => setModalConversionUnidad(null)}
                onConfirm={(cantidadConvertida) => {
                    const producto = productoPresentacion;
                    setModalConversionUnidad(null);
                    if (producto) void agregarProductoConPresentacion(producto, 'unidad', cantidadConvertida);
                }}
            />
            <ModalSeleccionarCliente
                isOpen={showClienteModal}
                onClose={() => setShowClienteModal(false)}
                onSelect={(cliente: any) => {
                    setClienteSeleccionado(cliente);
                    setVenta(prev => ({ ...prev, idcliente: cliente.idcliente }));
                    setShowClienteModal(false);
                }}
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

            <ModalAdvert
                isOpen={!!recetaPendiente}
                onClose={() => setRecetaPendiente(null)}
                message={recetaPendiente
                    ? (recetaPendiente.producto.receta === 'controlado'
                        ? `«${recetaPendiente.producto.nombre_producto}» es un medicamento CONTROLADO. Pedí y verificá la receta antes de venderlo.`
                        : `«${recetaPendiente.producto.nombre_producto}» se vende CON RECETA. Pedí la receta al cliente antes de venderlo.`)
                    : ''}
                confirmButtonText="Tengo la receta"
                onConfirm={() => {
                    const p = recetaPendiente;
                    setRecetaPendiente(null);
                    if (!p) return;
                    recetasConfirmadas.current.add(p.producto.idproducto);
                    void agregarProductoConPresentacion(p.producto, p.presentacion, p.cantidad);
                }}
            />

            <ModalAdvert
                isOpen={advertModalOpen}
                onClose={() => setAdvertModalOpen(false)}
                message={advertMessage}
            />

            <ModalComprobante
                isVenta={true}
                montoTotalDescuento={String(comprobanteData.montoDescuento)}
                montoTotalRecargo={String(comprobanteData.montoRecargo)}
                totalFinalVenta={comprobanteData.totalFinal}
                tipoDescuento={comprobanteData.tipoAjuste}
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                datos={comprobanteData}
                productos={comprobanteProductos}
                onGenerarComprobante={async () => {
                    if (!ventaComprobanteId) throw new Error('No se encontró la venta para generar el comprobante.');
                    const data = await generarComprobanteConProgreso(ventaComprobanteId, 'ticket', setProgresoComprobante);
                    if (!data?.facturaPDFBase64) throw new Error('No se pudo generar el comprobante PDF.');
                    setFacturaPDFBase64(data.facturaPDFBase64);
                    setShowPDFsModal(true);
                }}
                mostrarPagare={venta.tipo !== 'contado'}
                onGenerarPagare={async () => {
                    if (!ventaComprobanteId) throw new Error('No se encontró la venta para generar el pagaré.');
                    const data = await generarComprobanteConProgreso(ventaComprobanteId, 'pagare', setProgresoComprobante);
                    if (!data?.pagarePDFBase64) throw new Error('No se pudo generar el pagaré PDF.');
                    setPagarePDFBase64(data.pagarePDFBase64);
                    setShowPDFsModal(true);
                }}
                progresoComprobante={progresoComprobante}
            />

            <ModalError
                isOpen={errorModalOpen}
                onClose={() => {
                    setErrorModalOpen(false);
                    setErrorProductos([]);
                }}
                message={errorMessage}
                showTable={errorProductos.length > 0}
                productos={errorProductos}
            />

            <ModalSimuladorCuotas
                isOpen={showSimuladorCuotas}
                onClose={() => setShowSimuladorCuotas(false)}
                monto_financiar={total - (Number(montoDescuentoTotal) || 0) - ofertaTotal}
                cant_cuota={venta.cant_cuota}
                tasa_interes_anual={venta.tasa_interes_anual}
                dia_fecha_pago={venta.dia_fecha_pago}
            />

            <ModalSeleccionarLote
                setCantidadMaximo={setCantidadMaximo}
                isOpen={showLoteModal}
                onClose={() => setShowLoteModal(false)}
                lotes={lotesProducto}
                detalles={detalles}
                productoInfo={productoSeleccionado}
                onSelect={(loteSeleccionado) => {
                    const presentacion = presentacionPendiente;
                    const yaExiste = detalles.some(
                        (detalle) => detalle.idlote === loteSeleccionado.idlote
                    );

                    if (yaExiste) {
                        const detallesActualizados = detalles.map((detalle) => {
                            if (detalle.idlote === loteSeleccionado.idlote) {
                                //   Si es CAJA, incrementar cajas y recalcular cantidad total
                                if (presentacion === 'caja' && detalle.unidad_medida === 'CAJA') {
                                    const cajasActuales = parseFloat(detalle.cant_cajas_vender || '0');
                                    const cantidadAAgregar = cantidadProducto || 1;
                                    const nuevasCajas = cajasActuales + cantidadAAgregar;
                                    const unidadesSueltas = parseFloat(detalle.cant_unidades_sueltas || '0');
                                    const cantPorCaja = parseFloat(detalle.cant_p_caja || '0');
                                    const cantidadPacks = parseFloat(detalle.cant_packs_vender || '0') * parseFloat(detalle.cant_p_pack || '0');

                                    return {
                                        ...detalle,
                                        cant_cajas_vender: nuevasCajas,
                                        cantidad: (nuevasCajas * cantPorCaja) + cantidadPacks + unidadesSueltas,
                                    };
                                } else if (presentacion === 'pack') {
                                    const packs = Number(detalle.cant_packs_vender || 0) + 1;
                                    const cantidad = packs * Number(detalle.cant_p_pack || 0) + Number(detalle.cant_cajas_vender || 0) * Number(detalle.cant_p_caja || 0) + Number(detalle.cant_unidades_sueltas || 0);
                                    return { ...detalle, cant_packs_vender: packs, cantidad };
                                } else {
                                    return {
                                        ...detalle,
                                        cant_unidades_sueltas: Number(detalle.cant_unidades_sueltas || 0) + 1,
                                        cantidad: Number(detalle.cantidad || 0) + 1,
                                    };
                                }
                            }
                            return detalle;
                        });
                        setDetalles(detallesActualizados);
                    } else {
                        const nuevoDetalle: any = {
                            idproducto: loteSeleccionado.idproducto,
                            nombre_producto: loteSeleccionado.nombre_producto,
                            precio_venta: loteSeleccionado.precio_venta,
                            cantidadMaximo: loteSeleccionado.stock_actual,
                            precio_compra: loteSeleccionado.precio_compra,
                            fecha_vencimiento: loteSeleccionado.fecha_vencimiento,
                            unidad_medida: loteSeleccionado.unidad_medida,
                            iva: loteSeleccionado.iva,
                            idlote: loteSeleccionado.idlote,
                            numero_lote: loteSeleccionado.numero_lote,
                            descuento: 0,
                            precio_venta_pack: loteSeleccionado.precio_venta_pack || 0,
                            cant_p_pack: loteSeleccionado.cant_p_pack || 0,
                            cant_packs_vender: presentacion === 'pack' ? 1 : 0,
                            cant_cajas_vender: presentacion === 'caja' ? 1 : 0,
                            cant_unidades_sueltas: presentacion === 'unidad' ? 1 : 0,
                            ...camposPromoLinea(loteSeleccionado),
                        };

                        //   Si es CAJA, inicializar campos específicos
                        if (loteSeleccionado.unidad_medida === 'CAJA') {
                            const cajasIniciales = presentacion === 'caja' ? 1 : 0;
                            nuevoDetalle.cant_cajas_vender = cajasIniciales;
                            nuevoDetalle.cant_p_caja = loteSeleccionado.cant_p_caja || 0;
                            nuevoDetalle.precio_venta_caja = loteSeleccionado.precio_venta_caja || 0;
                            nuevoDetalle.precio_venta_pack = loteSeleccionado.precio_venta_pack || 0;
                            nuevoDetalle.cant_p_pack = loteSeleccionado.cant_p_pack || 0;
                            // Calcular las unidades base agregadas en cualquier presentación
                            const cantPorCaja = Number(loteSeleccionado.cant_p_caja) || 0;
                            nuevoDetalle.cantidad = cajasIniciales * cantPorCaja + Number(nuevoDetalle.cant_packs_vender || 0) * Number(nuevoDetalle.cant_p_pack || 0) + Number(nuevoDetalle.cant_unidades_sueltas || 0);
                        } else {
                            nuevoDetalle.cantidad = presentacion === 'pack' ? Number(nuevoDetalle.cant_p_pack || 0) : cantidadProducto;
                        }

                        setDetalles((prev) => [...prev, nuevoDetalle]);
                    }

                    setShowLoteModal(false);
                }}
            />

            <ModalVisualizarPDFs
                isOpen={showPDFsModal}
                onClose={() => {
                    setShowPDFsModal(false);
                    setFacturaPDFBase64(null);
                    setPagarePDFBase64(null);
                }}
                facturaPDF={facturaPDFBase64}
                pagarePDF={pagarePDFBase64}
            />
        </div >
    );
};

export default CrearVenta;
