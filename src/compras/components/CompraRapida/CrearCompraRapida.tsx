'use client';

import { resaltarCampos } from '../../../utils/camposInvalidos';
import AvisoCamposFaltantes, { type CampoFaltante } from '../../../components/AvisoCamposFaltantes';
import { useState } from 'react';
import FormularioProducto from './FormularioProducto/FormularioProducto';
import ModalConfirmarProductos from './ModalsCompraRapida/ModalConfirmarProductos';
import TablaProductos from './TablaProductos';
import ModalComprobante from './ModalsCompraRapida/ModalComprobante';
import { createCompra } from '../../../services/compras';
import { subirImagenProducto } from '../../../services/productos';
import ModalError from '../../../components/ModalError';
import { AlertTriangle, Truck, FileText } from 'lucide-react';
import { usuarioTieneFacturadorActivo } from '../../../services/facturador';
import ModalSeleccionarProveedor from '../../../productos/components/ModalsProductos/ModalSeleccionarProveedor';
import { GuiaTuki, BotonTuki, useGuiaTuki, resolverDestino, type PasoGuia } from '../../../components/guia/GuiaTuki';
import type { ProductoPrecargado } from './FormularioProducto/FormularioProducto';

interface CrearCompraRapidaProps {
    onSuccess?: () => void;
    onClose?: () => void;
    productoInicial?: ProductoPrecargado | null;
}

const fechaHoy = () => {
    const ahora = new Date();
    return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
};

// Cantidad que se manda al backend: cajas para un producto CAJA (con presentación CAJA), unidades para el resto.
const cantidadParaBackend = (p: any): number => {
    const presentacion = p.presentacion_compra || (p.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD');
    const unidades = parseFloat(p.cantidad) || 0;
    if (presentacion !== 'CAJA') return unidades;
    const porCaja = parseFloat(p.cant_p_caja) || 0;
    const cajas = parseFloat(p.cant_cajas) || (porCaja > 0 ? unidades / porCaja : 0);
    return Math.round(cajas * 1000) / 1000;
};

const CrearCompraRapida = ({ onSuccess, onClose, productoInicial }: CrearCompraRapidaProps) => {
    const [productosNuevos, setProductosNuevos] = useState<any[]>([]);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [productosError, setProductosError] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [comprobanteProductos, setComprobanteProductos] = useState<any[]>([]);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [avisoFotos, setAvisoFotos] = useState('');

    // Proveedor y nro. de factura reales. Antes iban fijos (idproveedor 1,
    // nro_factura '00001'): toda compra rápida quedaba atribuida al proveedor
    // GENERICO con la misma factura, y el historial se volvía imposible de
    // rastrear (186 compras del tenant 1 comparten el nro '00001').
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<any | null>(null);
    const [showProveedorModal, setShowProveedorModal] = useState(false);
    const [nroFactura, setNroFactura] = useState('');
    const [fechaCompra, setFechaCompra] = useState(fechaHoy());

    const [comprobanteData, setComprobanteData] = useState({
        nro_factura: '',
        fecha: '',
        cantidadProductos: 0
    });

    const agregarProducto = (producto: any) => {
        const idtemp = `temp-${Date.now()}`;

        setProductosNuevos(prev => [
            ...prev,
            { ...producto, idtemp, idproveedor: proveedorSeleccionado?.idproveedor ?? null }
        ]);


    };

    const [intentoRegistrar, setIntentoRegistrar] = useState(false);
    const faltantesCabecera = (): CampoFaltante[] => {
        const f: CampoFaltante[] = [];
        if (!proveedorSeleccionado?.idproveedor) f.push({ clave: 'proveedor', etiqueta: 'Proveedor' });
        if (!nroFactura.trim()) f.push({ clave: '[name="nro_factura"]', etiqueta: 'Nro. de factura' });
        return f;
    };
    const avisoCabecera = intentoRegistrar ? faltantesCabecera() : [];

    const handleSubmit = async () => {
        try {
            const tieneFacturadorActivo = await usuarioTieneFacturadorActivo();
            if (!tieneFacturadorActivo) {
                setErrorMessage('No tenes un facturador activo para tu usuario. No se puede registrar la compra.');
                setProductosError([]);
                setErrorModalOpen(true);
                return;
            }
        } catch (error) {
            console.error('Error al validar facturador activo:', error);
            setErrorMessage('No se pudo validar el facturador activo del usuario.');
            setProductosError([]);
            setErrorModalOpen(true);
            return;
        }
        // El lote es opcional: si no lo escribieron se usa «01» (ver numero_lote más abajo).

        // El backend rechaza la compra sin proveedor o sin factura, así que se avisa
        // acá con un mensaje entendible en lugar de dejar que falle el POST.
        // Se resalta en pantalla lo que falta (en vez de un cartel que lo tapa) y el aviso se achica al completarlo.
        setIntentoRegistrar(true);
        const pendientesCabecera = faltantesCabecera();
        if (pendientesCabecera.length > 0) {
            resaltarCampos(pendientesCabecera.map((f) => f.clave));
            return;
        }

        const compra = {
            idproveedor: proveedorSeleccionado.idproveedor,
            nro_factura: nroFactura.trim(),
            fecha: fechaCompra || fechaHoy(),
            tipo: 'contado',
            estado: 'pagado',
            descuento: 0,
            observacion: 'Inventario inicial',
            fecha_vencimiento: ''
        };

        // Los campos de caja tienen que viajar también en `detalles`, no sólo en
        // productosNuevos: el backend calcula el total de la compra y el stock del
        // lote recorriendo `detalles`. Sin ellos, una compra rápida de productos CAJA
        // se guardaba con total 0 y el lote se cargaba con cantidad × unidades por
        // caja (20 unidades entraban como 200).
        // La pantalla maneja la cantidad en UNIDADES; el backend, para un producto CAJA, espera CAJAS
        // (las multiplica por las unidades por caja). Mandar las unidades inflaba el stock y el total.
        const detallesFinales = productosNuevos.map((p) => ({
            idproducto: p.idtemp,
            cantidad: cantidadParaBackend(p),
            precio: p.precio_compra,
            precio_compra_caja: p.precio_compra_caja || null,
            precio_compra_presentacion: p.precio_compra_presentacion || null,
            presentacion_compra: p.presentacion_compra || (p.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD'),
            precio_venta_caja: p.precio_venta_caja || null,
            precio_venta_pack: p.precio_venta_pack || null,
            cant_p_pack: p.cant_p_pack || null,
            cant_p_caja: p.cant_p_caja || null,
            cant_cajas: p.cant_cajas || null,
            fecha_vencimiento: p.fecha_vencimiento || '',
            nombre_producto: p.nombre_producto,
            unidad_medida: p.unidad_medida,
            iva: p.iva,
            numero_lote: (p.numero_lote || '').trim() || '01',
            referencia_proveedor: p.referencia_proveedor || '',
            ubicacion_almacen: p.ubicacion_almacen || 'PRINCIPAL'
        }));

        // Normalizar el proveedor de cada producto: los que se agregaron antes de
        // elegir proveedor quedaron con null, y el backend los vincula vía
        // ProductoProveedor.
        const fotosPendientes = productosNuevos.filter((p) => p.imagenArchivo instanceof File).map((p) => ({ idtemp: p.idtemp, archivo: p.imagenArchivo as File }));
        const productosConProveedor = productosNuevos.map(({ imagenArchivo, ...p }) => ({
            ...p,
            idproveedor: compra.idproveedor
        }));

        try {
            const respuestaCompra = await createCompra({
                compra,
                detalles: detallesFinales,
                productosNuevos: productosConProveedor,
                isNewProducto: true
            });

            const productosCreados: Array<{ idtemp: string; idproducto: number }> = respuestaCompra.data?.productosCreados || [];
            const fallosFoto: string[] = [];
            for (const foto of fotosPendientes) {
                const producto = productosCreados.find((p) => p.idtemp === foto.idtemp);
                if (!producto) { fallosFoto.push(foto.idtemp); continue; }
                try {
                    await subirImagenProducto(producto.idproducto, foto.archivo);
                } catch (error) {
                    console.error('La compra se guardó, pero no se pudo subir la foto del producto:', error);
                    fallosFoto.push(productosNuevos.find((p) => p.idtemp === foto.idtemp)?.nombre_producto || foto.idtemp);
                }
            }
            if (fallosFoto.length) {
                setAvisoFotos(`La compra se registró. No se pudo guardar la foto de: ${fallosFoto.join(', ')}. Podés cargarla luego desde la ficha del producto.`);
            } else setAvisoFotos('');

            onSuccess && onSuccess();
            onClose && onClose();

            setComprobanteData({
                nro_factura: compra.nro_factura,
                fecha: compra.fecha,
                cantidadProductos: productosNuevos.length
            });
            const copiaProductos = productosNuevos.map(({ imagenArchivo, ...producto }) => producto);
            setComprobanteProductos(copiaProductos);
            setSuccessModalOpen(true);
            setProductosNuevos([]);
            setNroFactura('');
            setProveedorSeleccionado(null);
            setFechaCompra(fechaHoy());

        } catch (error: any) {
            console.error(error);

            setErrorMessage(error.response?.data.error || 'Error al registrar compra rápida');
            const productosDuplicados = error.response?.data.productosDuplicados;
            const productosConError = error.response?.data.productosConError;

            if (productosDuplicados) {
                setProductosError(productosDuplicados);
            } else if (productosConError) {
                setProductosError(productosConError);
            } else {
                setProductosError([]);
            }

            setErrorModalOpen(true);
        }
    };


    const handleEditProducto = (index: number, field: string, value: string) => {
        setProductosNuevos(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };
    const handleDeleteProducto = (index: number) => {
        setProductosNuevos(prev => prev.filter((_, i) => i !== index));

    };

    // Calcular totales
    const totalProductos = productosNuevos.length;
    const totalCantidad = productosNuevos.reduce((sum, p) => sum + (parseFloat(p.cantidad) || 0), 0);
    const totalValor = productosNuevos.reduce((sum, p) => {
        const presentacion = p.presentacion_compra || (p.unidad_medida === 'CAJA' ? 'CAJA' : 'UNIDAD');
        const precio = Number(p.precio_compra_presentacion ?? (presentacion === 'CAJA' ? (Number(p.precio_compra_caja || 0) || Number(p.precio_compra || 0) * Number(p.cant_p_caja || 1)) : presentacion === 'PACK' ? Number(p.precio_compra || 0) * Number(p.cant_p_pack || 1) : p.precio_compra));
        return sum + (cantidadParaBackend(p) * (precio || 0));
    }, 0);
    const dataHeader = {
        totalProductos,
        totalCantidad,
        totalValor
    };

    // Guía paso a paso de Tuki para cargar un producto (con su primera compra / stock inicial).
    const guiaProducto = useGuiaTuki('producto');
    const valor = (sel: string) => String((document.querySelector(sel) as HTMLInputElement | null)?.value ?? '').trim();
    const pasosGuiaProducto: PasoGuia[] = [
        { id: 'proveedor', destino: 'label:Proveedor', titulo: 'Proveedor', texto: 'Elegí a quién le comprás este producto. El stock que cargues entra como una compra a ese proveedor.', comprobar: () => !/Seleccionar proveedor/i.test(resolverDestino('label:Proveedor')?.textContent || 'Seleccionar proveedor') },
        { id: 'factura', destino: 'css:input[name="nro_factura"]', titulo: 'Número de factura', texto: 'Escribí el de la factura del proveedor o una referencia. Si es tu stock de arranque, podés poner "Inventario inicial".', comprobar: () => valor('input[name="nro_factura"]') !== '' },
        { id: 'nombre', destino: 'css:input[name="nombre_producto"]', titulo: 'Nombre del producto', texto: 'Escribilo como lo vas a buscar al vender. Para medicamentos conviene incluir la presentación, por ejemplo "Ibuprofeno 400 mg x 10 comp.".', comprobar: () => valor('input[name="nombre_producto"]') !== '' },
        { id: 'codigo', destino: 'css:input[name="cod_barra"]', titulo: 'Código de barras', texto: 'Escaneá el que trae la caja, o tocá Generar para que el sistema le asigne uno propio. Es opcional, pero acelera las ventas.', comprobar: () => valor('input[name="cod_barra"]') !== '' },
        { id: 'categoria', destino: 'label:Categoría', titulo: 'Categoría', texto: 'Elegí una de la lista, o creá una nueva desde la misma ventana (por ejemplo "Analgésicos" o "Antibióticos").', comprobar: () => !/^seleccionar categor/i.test((resolverDestino('label:Categoría')?.textContent || 'Seleccionar categoría').trim()) },
        { id: 'unidad', destino: 'css:select[name="unidad_medida"]', titulo: '¿Cómo se cuenta?', texto: 'Unidad: se vende de a uno. Caja: viene en cajas con varias unidades (por ejemplo una cajita de 30 comprimidos). Más abajo podés definir también un pack, como un blíster de 10.', comprobar: () => valor('select[name="unidad_medida"]') !== '' },
        { id: 'iva', destino: 'css:select[name="iva"]', titulo: 'IVA', texto: 'Elegí el que figura en la factura de compra.', comprobar: () => valor('select[name="iva"]') !== '' },
        { id: 'precios', destino: 'label:P. Compra', titulo: 'Costo y precio de venta', texto: 'Escribí cuánto te cuesta cada unidad y tu porcentaje de ganancia: el precio de venta se calcula solo y lo podés cambiar.' },
        { id: 'lote', destino: 'css:input[name="numero_lote"]', titulo: 'Número de lote', texto: 'Viene impreso en la caja del medicamento. El sistema usa el lote para vender primero lo que vence antes.' },
        { id: 'cantidad', destino: 'css:input[name="cantidad"]', titulo: 'Cantidad que tenés', texto: 'Escribí cuántas unidades hay en stock.', comprobar: () => Number(valor('input[name="cantidad"]')) > 0 },
        { id: 'vence', destino: 'css:input[name="fecha_vencimiento"]', titulo: 'Fecha de vencimiento', texto: 'Para medicamentos es muy importante: así el sistema sabe qué lote vence primero.', comprobar: () => valor('input[name="fecha_vencimiento"]') !== '' },
        { id: 'agregar', destino: 'boton:Agregar Producto', titulo: 'Agregá el producto', texto: 'Tocá Agregar Producto. Podés cargar varios seguidos y al final registrar todo junto.' },
    ];
    const mostrarTuki = !productoInicial;

    return (
        <div className="w-full 2xl:p-3 lg:p-2 md:p-2">
            {mostrarTuki && !guiaProducto.abierta && <BotonTuki nombre="el producto" invitar={guiaProducto.invitar} onAbrir={guiaProducto.abrir} onRechazar={guiaProducto.rechazarInvitacion} />}
            {mostrarTuki && guiaProducto.abierta && <GuiaTuki nombre="producto" pasos={pasosGuiaProducto} onCerrar={guiaProducto.cerrar} />}
            {/* Esta pantalla es más ancha que el resto: en portátiles se achica un poco más (sobre el 80 % general) para que quepa con el menú lateral abierto. */}
            <div className="xl:max-2xl:[zoom:0.92]">
                {/* Datos de la compra: proveedor, factura y fecha.
                    Antes iban fijos en el código (proveedor GENERICO, factura
                    '00001'), así que ninguna compra rápida era rastreable. */}
                <AvisoCamposFaltantes faltantes={avisoCabecera} className="mb-3" />
                <div className="mb-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-2xl p-3">
                    <div className="flex flex-col md:flex-row md:items-end gap-3">
                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                Proveedor <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                data-campo="proveedor"
                                onClick={() => setShowProveedorModal(true)}
                                className={`w-full flex items-center gap-2 border-2 rounded-xl px-4 py-3 text-sm font-medium text-left transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-700 dark:text-gray-100 ${proveedorSeleccionado
                                    ? 'border-blue-300 dark:border-blue-700'
                                    : 'border-rose-300 dark:border-rose-700'
                                    }`}
                            >
                                <Truck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                <span className="truncate">
                                    {proveedorSeleccionado
                                        ? proveedorSeleccionado.nombre
                                        : 'Seleccionar proveedor...'}
                                </span>
                            </button>
                        </div>

                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                Nro. de Factura <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
                                <input
                                    type="text"
                                    name="nro_factura"
                                    value={nroFactura}
                                    onChange={(e) => setNroFactura(e.target.value)}
                                    placeholder="001-001-0000001"
                                    className={`w-full bg-white dark:bg-gray-700 border-2 rounded-xl pl-9 pr-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-400 transition-all shadow-sm hover:shadow-md ${nroFactura.trim()
                                        ? 'border-blue-200 dark:border-blue-700'
                                        : 'border-rose-300 dark:border-rose-700'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                name="fecha"
                                value={fechaCompra}
                                onChange={(e) => setFechaCompra(e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100 transition-all shadow-sm hover:shadow-md"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] 2xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,0.9fr)]">
                    {/* Formulario de Producto */}
                    <div className="">
                        <FormularioProducto dataHeader = {dataHeader} onAgregar={agregarProducto} onShowModalConfirm={setConfirmModalOpen} productosNuevos={productosNuevos} productoInicial={productoInicial} />
                    </div>
                    {/* Tabla de Productos */}
                    <div>
                        {productosNuevos.length > 0 ? (
                            <div className="w-full min-w-0 overflow-hidden rounded-2xl shadow-xl">
                                <div className="rounded-t-lg bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h3 className="truncate text-base font-bold text-white">Productos Agregados</h3>
                                            <div className='flex flex-row gap-3'>
                                                <p className='text-sm text-white mt-1 truncate'>Productos seleccionados:</p>
                                                <p className='text-white text-sm bg-blue-600 rounded-full px-2 py-1'>{productosNuevos.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 max-h-[min(70vh,720px)] overflow-auto">
                                    <TablaProductos
                                        productos={productosNuevos}
                                        onEditProducto={handleEditProducto}
                                        onDeleteProducto={handleDeleteProducto}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                                <div className="mb-3 rounded-2xl bg-blue-100 p-4 dark:bg-gray-700">
                                    <AlertTriangle className="text-blue-500 dark:text-blue-400" size={36} />
                                </div>
                                <div className="max-w-sm">
                                    <h3 className="mb-1 text-base font-bold text-slate-800 dark:text-gray-100">Todavia no hay productos</h3>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-400">Los productos que agregues apareceran aqui para revisar cantidades y precios antes de registrar la compra.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Modales */}
                <ModalError
                    showTable={true}
                    productos={productosError}
                    isOpen={errorModalOpen}
                    onClose={() => setErrorModalOpen(false)}
                    message={errorMessage}
                />
                <ModalConfirmarProductos
                    isOpen={confirmModalOpen}
                    onClose={() => setConfirmModalOpen(false)}
                    onConfirm={() => {
                        setConfirmModalOpen(false);
                        handleSubmit();
                    }}
                    productos={productosNuevos}
                />
                <ModalComprobante
                    isOpen={successModalOpen}
                    onClose={() => setSuccessModalOpen(false)}
                    datos={comprobanteData}
                    productos={comprobanteProductos}
                    avisoFotos={avisoFotos}
                />
                <ModalSeleccionarProveedor
                    isOpen={showProveedorModal}
                    onClose={() => setShowProveedorModal(false)}
                    onSelect={(proveedor: any) => {
                        setProveedorSeleccionado(proveedor);
                        setShowProveedorModal(false);
                    }}
                />
            </div>
        </div>
    );
};

export default CrearCompraRapida;
