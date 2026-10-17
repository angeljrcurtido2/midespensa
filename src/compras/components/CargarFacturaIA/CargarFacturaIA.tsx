'use client';

import { useEffect, useRef, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import { FileImage, Loader2, Sparkles, Trash2, Truck } from 'lucide-react';
import {
  extraerFactura,
  type FacturaExtraidaResponse,
  type ItemFacturaExtraido,
} from '../../../services/reconocimiento';
import { createCompra } from '../../../services/compras';
import { getDetalles, type DetalleProductoResponse } from '../../../services/productoDetalle';
import ModalRepartoAtributos, { textoReparto, sumaReparto, type RepartoItem } from '../../../components/ModalRepartoAtributos';
import ModalError from '../../../components/ModalError';
import CreditosIABadge from '../../../components/CreditosIABadge';
import { useCreditosIA } from '../../../hooks/useCreditosIA';
import { mensajeErrorIA } from '../../../services/creditosIA';
import ModalSeleccionarProveedor from '../../../productos/components/ModalsProductos/ModalSeleccionarProveedor';
import ModalSeleccionarCategoria from '../../../productos/components/ModalsProductos/ModalSeleccionarCategoria';

interface CargarFacturaIAProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

// Fila editable derivada de un item que devolvió /voice/factura-extraer.
// Se separa del tipo de la API porque acá el usuario puede corregir todo
// antes de confirmar: cantidad, precio, a qué producto matchea o si es nuevo.
interface FilaFactura {
  descripcion_factura: string;
  cantidad: string;
  precio_unitario: string;
  idproducto: number | 'nuevo';
  nombre_producto: string;
  unidad_medida: string;
  iva: string;
  idcategoria: string;
  cod_barra: string;
  similitud: number | null;
  incluir: boolean;
  // CAJA: la IA sugiere es_caja/unidades_por_caja leyendo la factura, pero es
  // editable siempre — el usuario confirma antes de guardar. Cuando matchea
  // con un producto existente que YA está cargado como CAJA, se respeta esa
  // config (no tiene sentido cambiarle la unidad de medida a un producto ya
  // creado) y sólo queda editable la cantidad de cajas.
  esCaja: boolean;
  cantPCaja: string;
  cantCajas: string;
  precioCompraCaja: string;
  precioVentaCaja: string;
  // true si el match existente ya es CAJA: bloquea el toggle es_caja/precio
  // por caja porque esos datos vienen del producto, no de la factura.
  cajaFijaPorProductoExistente: boolean;
  // Producto existente con atributos (color, sabor…): cómo se reparten las unidades que entran.
  atributos?: RepartoItem[];
}

// Unidades de stock que entran por esta fila: cajas × unidades por caja, o la cantidad si es por unidad.
const unidadesQueEntran = (f: FilaFactura) =>
  f.esCaja ? (Number(f.cantCajas || f.cantidad) || 0) * (Number(f.cantPCaja) || 1) : Number(f.cantidad) || 0;

const fechaHoy = () => {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

const filaDesdeItem = (item: ItemFacturaExtraido): FilaFactura => {
  const sugerido = item.producto_sugerido;
  // El producto existente ya es CAJA en el inventario (cant_p_caja > 0):
  // se respeta esa unidad de medida, la factura no puede "desconvertirlo".
  const existenteEsCaja = !!sugerido && Number(sugerido.cant_p_caja) > 0;
  const esCaja = existenteEsCaja || Boolean(item.es_caja_factura);

  return {
    descripcion_factura: item.descripcion_factura,
    cantidad: item.cantidad != null ? String(item.cantidad) : '1',
    precio_unitario: item.precio_unitario != null ? String(item.precio_unitario) : '',
    idproducto: sugerido ? sugerido.idproducto : 'nuevo',
    nombre_producto: sugerido ? sugerido.nombre_producto : item.descripcion_factura,
    unidad_medida: sugerido ? sugerido.unidad_medida : (esCaja ? 'CAJA' : 'UNIDAD'),
    iva: sugerido ? String(sugerido.iva) : '10',
    idcategoria: '',
    cod_barra: sugerido ? sugerido.cod_barra || '' : '',
    similitud: sugerido ? sugerido.similitud : null,
    incluir: true,
    esCaja,
    cantPCaja: existenteEsCaja
      ? String(sugerido!.cant_p_caja)
      : (item.unidades_por_caja_factura != null ? String(item.unidades_por_caja_factura) : ''),
    // cantidad leída de la factura = cantidad de CAJAS cuando es_caja; el
    // precio_unitario leído ya es el precio de la caja en ese caso.
    cantCajas: esCaja ? (item.cantidad != null ? String(item.cantidad) : '1') : '',
    precioCompraCaja: existenteEsCaja
      ? String(sugerido!.precio_compra_caja ?? '')
      : (esCaja && item.precio_unitario != null ? String(item.precio_unitario) : ''),
    precioVentaCaja: existenteEsCaja ? String(sugerido!.precio_venta_caja ?? '') : '',
    cajaFijaPorProductoExistente: existenteEsCaja,
  };
};

const CargarFacturaIA = ({ onSuccess, onClose }: CargarFacturaIAProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const { alcanza: alcanzaCreditos } = useCreditosIA('factura');
  const [guardando, setGuardando] = useState(false);
  const [extraccion, setExtraccion] = useState<FacturaExtraidaResponse | null>(null);
  const [filas, setFilas] = useState<FilaFactura[]>([]);

  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<any | null>(null);
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [nroFactura, setNroFactura] = useState('');
  const [fechaCompra, setFechaCompra] = useState(fechaHoy());

  const [categoriaModalIndex, setCategoriaModalIndex] = useState<number | null>(null);
  const [categoriasElegidas, setCategoriasElegidas] = useState<Record<number, any>>({});

  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalOpen, setErrorModalOpen] = useState(false);

  // Productos con atributos: el servidor exige repartir las unidades que entran entre ellos.
  const [atributosPorProducto, setAtributosPorProducto] = useState<Record<number, DetalleProductoResponse[]>>({});
  const [repartoAbierto, setRepartoAbierto] = useState<number | null>(null);
  const idsExistentes = filas.map((x) => (x.idproducto === 'nuevo' ? '' : String(x.idproducto))).join(',');
  useEffect(() => {
    const ids = Array.from(new Set(filas.map((x) => x.idproducto).filter((id): id is number => typeof id === 'number' && id > 0)));
    let activo = true;
    Promise.all(
      ids.map((id) => getDetalles(id).then((r) => [id, (r.detalles || []) as DetalleProductoResponse[]] as const).catch(() => [id, [] as DetalleProductoResponse[]] as const))
    ).then((pares) => {
      if (activo) setAtributosPorProducto(Object.fromEntries(pares));
    });
    return () => {
      activo = false;
    };
  }, [idsExistentes]);

  const botonReparto = (index: number, fila: FilaFactura) => {
    const attrs = typeof fila.idproducto === 'number' ? atributosPorProducto[fila.idproducto] || [] : [];
    if (!attrs.length) return null;
    const unidades = unidadesQueEntran(fila);
    const completo = unidades > 0 && sumaReparto(fila.atributos) === unidades;
    return (
      <button
        type="button"
        onClick={() => setRepartoAbierto(index)}
        className={`mt-1 mb-1 flex w-full items-center justify-between gap-2 rounded-lg border-2 px-2 py-1 text-xs font-semibold ${completo ? 'border-purple-300 bg-purple-50 text-purple-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}
      >
        <span className="truncate">
          Repartir por atributo
          {fila.atributos && fila.atributos.length > 0 && <span className="ml-1 font-bold">({textoReparto(fila.atributos, attrs)})</span>}
        </span>
        <span className={`${completo ? 'bg-purple-600' : 'bg-amber-500'} shrink-0 rounded-full px-2 py-0.5 text-white`}>{completo ? '✓ Repartido' : 'Falta repartir'}</span>
      </button>
    );
  };

  const resetTodo = () => {
    setImagenPreview(null);
    setExtraccion(null);
    setFilas([]);
    setProveedorSeleccionado(null);
    setNroFactura('');
    setFechaCompra(fechaHoy());
    setCategoriasElegidas({});
  };

  const handleArchivoSeleccionado = async (file: File) => {
    const base64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result ? result.split(',')[1] : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    if (!base64) {
      setErrorMessage('No se pudo leer la imagen seleccionada.');
      setErrorModalOpen(true);
      return;
    }

    setImagenPreview(`data:${file.type};base64,${base64}`);
    setProcesando(true);
    setExtraccion(null);
    setFilas([]);

    try {
      const respuesta = await extraerFactura(base64);
      setExtraccion(respuesta);
      setFilas(respuesta.items.map(filaDesdeItem));
      setNroFactura(respuesta.factura.nro_factura || '');
      if (respuesta.factura.fecha) setFechaCompra(respuesta.factura.fecha);
      if (respuesta.proveedor_sugerido) {
        setProveedorSeleccionado({
          idproveedor: respuesta.proveedor_sugerido.idproveedor,
          nombre: respuesta.proveedor_sugerido.nombre,
        });
      }
      if (respuesta.items.length === 0) {
        setErrorMessage('No se detectaron productos en la factura. Podés reintentar con otra foto más nítida.');
        setErrorModalOpen(true);
      }
    } catch (error: any) {
      console.error('Error al extraer factura:', error);
      setErrorMessage(mensajeErrorIA(error, 'No se pudo leer la factura. Probá de nuevo en unos segundos.'));
      setErrorModalOpen(true);
    } finally {
      setProcesando(false);
    }
  };

  const actualizarFila = (index: number, cambios: Partial<FilaFactura>) => {
    setFilas((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...('idproducto' in cambios ? { atributos: undefined } : {}), ...cambios } : f))
    );
  };

  const eliminarFila = (index: number) => {
    setFilas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    if (!proveedorSeleccionado?.idproveedor) {
      setErrorMessage('Debés seleccionar un proveedor para registrar la compra.');
      setErrorModalOpen(true);
      return;
    }
    if (!nroFactura.trim()) {
      setErrorMessage('El número de factura es obligatorio.');
      setErrorModalOpen(true);
      return;
    }

    const filasIncluidas = filas.filter((f) => f.incluir);
    if (filasIncluidas.length === 0) {
      setErrorMessage('No hay productos seleccionados para cargar.');
      setErrorModalOpen(true);
      return;
    }

    const filasNuevasSinCategoria = filasIncluidas.filter(
      (f) => f.idproducto === 'nuevo' && !f.idcategoria
    );
    if (filasNuevasSinCategoria.length > 0) {
      setErrorMessage(
        `Falta elegir categoría para: ${filasNuevasSinCategoria.map((f) => f.nombre_producto).join(', ')}`
      );
      setErrorModalOpen(true);
      return;
    }

    const filasSinPrecio = filasIncluidas.filter(
      (f) => !f.precio_unitario || Number(f.precio_unitario) <= 0
    );
    if (filasSinPrecio.length > 0) {
      setErrorMessage(
        `Falta precio unitario válido para: ${filasSinPrecio.map((f) => f.nombre_producto).join(', ')}`
      );
      setErrorModalOpen(true);
      return;
    }

    // CAJA: cant_p_caja (unidades por caja) es obligatorio y > 0 para
    // productos NUEVOS por caja — createCompra lo exige y rechaza la compra
    // entera si falta, así que se valida antes de mandar nada.
    const filasCajaSinDatos = filasIncluidas.filter(
      (f) => f.esCaja && (!f.cantPCaja || Number(f.cantPCaja) <= 0)
    );
    if (filasCajaSinDatos.length > 0) {
      setErrorMessage(
        `Falta indicar "unidades por caja" (> 0) para: ${filasCajaSinDatos.map((f) => f.nombre_producto).join(', ')}`
      );
      setErrorModalOpen(true);
      return;
    }

    const sinReparto = filasIncluidas.filter((f) => {
      if (typeof f.idproducto !== 'number') return false;
      const attrs = atributosPorProducto[f.idproducto] || [];
      return attrs.length > 0 && sumaReparto(f.atributos) !== unidadesQueEntran(f);
    });
    if (sinReparto.length > 0) {
      setErrorMessage(
        `Repartí las unidades entre los atributos (color, sabor…) de: ${sinReparto.map((f) => `${f.nombre_producto} (${unidadesQueEntran(f)} unidades)`).join(', ')}`
      );
      setErrorModalOpen(true);
      return;
    }

    const compra = {
      idproveedor: proveedorSeleccionado.idproveedor,
      nro_factura: nroFactura.trim(),
      fecha: fechaCompra || fechaHoy(),
      tipo: 'contado',
      estado: 'pagado',
      descuento: 0,
      observacion: 'Carga por IA desde factura',
      fecha_vencimiento: '',
    };

    const productosNuevos = filasIncluidas
      .filter((f) => f.idproducto === 'nuevo')
      .map((f, i) => ({
        idtemp: `temp-ia-${Date.now()}-${i}`,
        nombre_producto: f.nombre_producto,
        // Si es CAJA, precio_unitario acá es el precio de la caja (así lo
        // llenó filaDesdeItem); createCompra deriva el precio por unidad
        // dividiendo por cant_p_caja, siguiendo el mismo criterio que
        // FormCrearProductoInline usa para compras manuales.
        precio_compra: f.esCaja ? undefined : f.precio_unitario,
        precio_compra_caja: f.esCaja ? f.precio_unitario : null,
        precio_venta: f.esCaja ? undefined : f.precio_unitario,
        precio_venta_caja: f.esCaja ? f.precioVentaCaja || f.precio_unitario : null,
        cod_barra: f.cod_barra || null,
        unidad_medida: f.esCaja ? 'CAJA' : 'UNIDAD',
        cant_p_caja: f.esCaja ? f.cantPCaja : null,
        cant_cajas: f.esCaja ? (f.cantCajas || f.cantidad) : null,
        iva: f.iva,
        idcategoria: Number(f.idcategoria),
        idproveedor: proveedorSeleccionado.idproveedor,
        // cantidad = stock inicial que createCompra usa para el producto
        // nuevo; en CAJA es cajas × unidades por caja.
        cantidad: f.esCaja
          ? (Number(f.cantCajas || f.cantidad) * Number(f.cantPCaja)).toString()
          : f.cantidad,
      }));

    // Cada fila "nueva" necesita el idtemp que le acabamos de asignar arriba:
    // se reconstruye la lista de detalles en el mismo orden para poder
    // encontrar ese idtemp por posición.
    let cursorNuevo = 0;
    const detalles = filasIncluidas.map((f) => {
      const base = f.esCaja
        ? {
            // En CAJA, "cantidad" del detalle es la cantidad de cajas
            // (createCompra la usa como cant_cajas del lote/stock).
            cantidad: f.cantCajas || f.cantidad,
            precio: f.esCaja && f.idproducto === 'nuevo'
              ? (Number(f.precioVentaCaja || f.precio_unitario) / Number(f.cantPCaja)).toFixed(2)
              : f.precio_unitario,
            precio_compra_caja: f.precioCompraCaja || f.precio_unitario,
            cant_p_caja: f.cantPCaja,
            cant_cajas: f.cantCajas || f.cantidad,
          }
        : {
            cantidad: f.cantidad,
            precio: f.precio_unitario,
          };

      if (f.idproducto === 'nuevo') {
        const idtemp = productosNuevos[cursorNuevo].idtemp;
        cursorNuevo++;
        return {
          idproducto: idtemp,
          ...base,
          fecha_vencimiento: '',
          nombre_producto: f.nombre_producto,
          unidad_medida: f.esCaja ? 'CAJA' : 'UNIDAD',
          iva: f.iva,
          numero_lote: '01',
          referencia_proveedor: '',
          ubicacion_almacen: 'PRINCIPAL',
        };
      }
      return {
        idproducto: f.idproducto,
        ...base,
        atributos: f.atributos || [],
        fecha_vencimiento: '',
        nombre_producto: f.nombre_producto,
        unidad_medida: f.unidad_medida,
        iva: f.iva,
        numero_lote: '01',
        referencia_proveedor: '',
        ubicacion_almacen: 'PRINCIPAL',
      };
    });

    setGuardando(true);
    try {
      await createCompra({
        compra,
        detalles,
        productosNuevos,
        isNewProducto: productosNuevos.length > 0,
      });

      onSuccess && onSuccess();
      onClose && onClose();
      resetTodo();
    } catch (error: any) {
      console.error('Error al registrar compra desde factura IA:', error);
      setErrorMessage(error.response?.data?.error || 'Error al registrar la compra.');
      setErrorModalOpen(true);
    } finally {
      setGuardando(false);
    }
  };

  const totalEstimado = filas
    .filter((f) => f.incluir)
    .reduce((acc, f) => {
      // CAJA: precio_unitario ya es precio por caja, cantCajas es la
      // cantidad de cajas — igual que TotalCompra.tsx calcula en la compra
      // manual (precio_compra_caja × cant_cajas).
      const cantidad = Number(f.esCaja ? f.cantCajas : f.cantidad) || 0;
      const precio = Number(f.precio_unitario) || 0;
      return acc + cantidad * precio;
    }, 0);

  return (
    <div className="w-full space-y-4 p-4 pb-6">
      <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Cargar factura con IA
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Subí una foto o captura de la factura y la IA propone los productos a cargar.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleArchivoSeleccionado(file);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={procesando || !alcanzaCreditos}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl px-4 py-6 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all disabled:opacity-60"
        >
          {procesando ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Leyendo factura con IA...
            </>
          ) : (
            <>
              <FileImage size={18} />
              {imagenPreview ? 'Cambiar imagen de factura' : 'Seleccionar imagen de factura'}
            </>
          )}
        </button>
        <CreditosIABadge tipo="factura" className="mt-1.5 justify-center" />

        {imagenPreview && (
          <img
            src={imagenPreview}
            alt="Factura"
            className="mt-3 max-h-56 rounded-xl border border-gray-200 dark:border-gray-700 mx-auto"
          />
        )}
      </div>

      {extraccion && filas.length > 0 && (
        <>
          <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Proveedor <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(true)}
                  className={`w-full flex items-center gap-2 border-2 rounded-xl px-4 py-3 text-sm font-medium text-left transition-all bg-white dark:bg-gray-700 dark:text-gray-100 ${
                    proveedorSeleccionado ? 'border-blue-300 dark:border-blue-700' : 'border-rose-300 dark:border-rose-700'
                  }`}
                >
                  <Truck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">
                    {proveedorSeleccionado ? proveedorSeleccionado.nombre : 'Seleccionar proveedor...'}
                  </span>
                </button>
                {extraccion.factura.proveedor_nombre && !proveedorSeleccionado && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    La factura menciona "{extraccion.factura.proveedor_nombre}" pero no se encontró en tu lista.
                  </p>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Nro. de Factura <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nroFactura}
                  onChange={(e) => setNroFactura(e.target.value)}
                  placeholder="001-001-0000001"
                  className="w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100"
                />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                  className="w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
              <h3 className="text-white font-bold">Productos detectados ({filas.length})</h3>
              <p className="text-blue-100 text-xs">
                Revisá cada renglón: podés corregir cantidad, precio, o cambiar si matchea con un producto existente.
              </p>
            </div>

            {/* < lg: una card apilada por producto — la tabla de 7 columnas
                no entra en pantallas chicas/tablet sin comprimir cada celda
                a ilegible. >= lg: tabla clásica, hay ancho de sobra. */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700 lg:hidden">
              {filas.map((fila, index) => (
                <div
                  key={index}
                  className={`p-3 space-y-3 ${!fila.incluir ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-start gap-2 min-w-0 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fila.incluir}
                        onChange={(e) => actualizarFila(index, { incluir: e.target.checked })}
                        className="mt-1 shrink-0"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-0 truncate">
                        {fila.descripcion_factura}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => eliminarFila(index)}
                      className="text-rose-500 hover:text-rose-700 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {fila.idproducto === 'nuevo' ? (
                    <div className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Producto nuevo
                      </span>
                      <input
                        type="text"
                        value={fila.nombre_producto}
                        onChange={(e) => actualizarFila(index, { nombre_producto: e.target.value })}
                        className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setCategoriaModalIndex(index)}
                        className={`text-xs px-2 py-1 rounded-lg border-2 ${
                          fila.idcategoria
                            ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300'
                            : 'border-rose-300 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {categoriasElegidas[index]?.categoria || 'Elegir categoría'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Match {fila.similitud}%
                      </span>
                      <p className="text-gray-800 dark:text-gray-100 font-medium text-sm">{fila.nombre_producto}</p>
                      {botonReparto(index, fila)}
                      <button
                        type="button"
                        onClick={() => actualizarFila(index, { idproducto: 'nuevo', nombre_producto: fila.descripcion_factura })}
                        className="text-xs text-blue-600 dark:text-blue-400 underline"
                      >
                        Cargar como nuevo en vez
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-3">
                    <label className={`flex items-center gap-1.5 text-xs ${fila.cajaFijaPorProductoExistente ? 'opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={fila.cajaFijaPorProductoExistente}
                        checked={fila.esCaja}
                        onChange={(e) => actualizarFila(index, {
                          esCaja: e.target.checked,
                          unidad_medida: e.target.checked ? 'CAJA' : 'UNIDAD',
                        })}
                      />
                      Por caja
                      {fila.cajaFijaPorProductoExistente && (
                        <span className="text-gray-400">(ya cargado así)</span>
                      )}
                    </label>
                    {fila.esCaja && (
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Unid/caja</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          disabled={fila.cajaFijaPorProductoExistente}
                          value={fila.cantPCaja}
                          onChange={(e) => actualizarFila(index, { cantPCaja: e.target.value })}
                          className="w-20 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-xs text-center disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {fila.esCaja ? 'Cant. cajas' : 'Cantidad'}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fila.esCaja ? fila.cantCajas : fila.cantidad}
                        onChange={(e) => actualizarFila(index, fila.esCaja ? { cantCajas: e.target.value } : { cantidad: e.target.value })}
                        className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {fila.esCaja ? 'Precio x caja' : 'Precio unit.'}
                      </label>
                      <NumericFormat
                        value={fila.precio_unitario}
                        thousandSeparator="."
                        decimalSeparator=","
                        allowNegative={false}
                        onValueChange={(v) => actualizarFila(index, { precio_unitario: v.value || '' })}
                        className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1.5 text-sm text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-center">Incluir</th>
                    <th className="px-3 py-2 text-left">Descripción factura</th>
                    <th className="px-3 py-2 text-left">Producto a cargar</th>
                    <th className="px-3 py-2 text-center">Presentación</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Precio unit.</th>
                    <th className="px-3 py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, index) => (
                    <tr
                      key={index}
                      className={`border-t border-gray-100 dark:border-gray-700 ${!fila.incluir ? 'opacity-40' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={fila.incluir}
                          onChange={(e) => actualizarFila(index, { incluir: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                        {fila.descripcion_factura}
                      </td>
                      <td className="px-3 py-2">
                        {fila.idproducto === 'nuevo' ? (
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              Producto nuevo
                            </span>
                            <input
                              type="text"
                              value={fila.nombre_producto}
                              onChange={(e) => actualizarFila(index, { nombre_producto: e.target.value })}
                              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setCategoriaModalIndex(index)}
                              className={`text-xs px-2 py-1 rounded-lg border-2 ${
                                fila.idcategoria
                                  ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300'
                                  : 'border-rose-300 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {categoriasElegidas[index]?.categoria || 'Elegir categoría'}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 mb-1">
                              Match {fila.similitud}%
                            </span>
                            <p className="text-gray-800 dark:text-gray-100 font-medium">{fila.nombre_producto}</p>
                            {botonReparto(index, fila)}
                            <button
                              type="button"
                              onClick={() => actualizarFila(index, { idproducto: 'nuevo', nombre_producto: fila.descripcion_factura })}
                              className="text-xs text-blue-600 dark:text-blue-400 underline"
                            >
                              Cargar como nuevo en vez
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <label className={`flex items-center gap-1 text-xs ${fila.cajaFijaPorProductoExistente ? 'opacity-50' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              disabled={fila.cajaFijaPorProductoExistente}
                              checked={fila.esCaja}
                              onChange={(e) => actualizarFila(index, {
                                esCaja: e.target.checked,
                                unidad_medida: e.target.checked ? 'CAJA' : 'UNIDAD',
                              })}
                            />
                            Por caja
                          </label>
                          {fila.cajaFijaPorProductoExistente && (
                            <span className="text-[10px] text-gray-400 text-center leading-tight">
                              Ya cargado<br />como caja
                            </span>
                          )}
                          {fila.esCaja && (
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="Unid/caja"
                              disabled={fila.cajaFijaPorProductoExistente}
                              value={fila.cantPCaja}
                              onChange={(e) => actualizarFila(index, { cantPCaja: e.target.value })}
                              className="w-20 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-xs text-center disabled:opacity-50"
                              title="Cuántas unidades trae cada caja"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={fila.esCaja ? fila.cantCajas : fila.cantidad}
                          onChange={(e) => actualizarFila(index, fila.esCaja ? { cantCajas: e.target.value } : { cantidad: e.target.value })}
                          className="w-20 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm text-right"
                          title={fila.esCaja ? 'Cantidad de cajas' : 'Cantidad de unidades'}
                        />
                        {fila.esCaja && <p className="text-[10px] text-gray-400 text-right">cajas</p>}
                      </td>
                      <td className="px-3 py-2">
                        <NumericFormat
                          value={fila.precio_unitario}
                          thousandSeparator="."
                          decimalSeparator=","
                          allowNegative={false}
                          onValueChange={(v) => actualizarFila(index, { precio_unitario: v.value || '' })}
                          className="w-28 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm text-right"
                        />
                        {fila.esCaja && <p className="text-[10px] text-gray-400 text-right">precio x caja</p>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarFila(index)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-3 bg-gray-50 dark:bg-gray-700/50">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Total estimado ({filas.filter((f) => f.incluir).length} productos)
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {Math.round(totalEstimado).toLocaleString('es-PY')} Gs
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                resetTodo();
                onClose && onClose();
              }}
              className="flex-1 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-gray-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
            >
              {guardando ? 'Registrando compra...' : 'Confirmar y registrar compra'}
            </button>
          </div>
        </>
      )}

      {repartoAbierto !== null && typeof filas[repartoAbierto]?.idproducto === 'number' && (
        <ModalRepartoAtributos
          isOpen
          onClose={() => setRepartoAbierto(null)}
          nombre={filas[repartoAbierto].nombre_producto}
          unidades={unidadesQueEntran(filas[repartoAbierto])}
          atributos={atributosPorProducto[filas[repartoAbierto].idproducto as number] || []}
          modo="compra"
          inicial={filas[repartoAbierto].atributos}
          onConfirm={(reparto) => {
            actualizarFila(repartoAbierto, { atributos: reparto });
            setRepartoAbierto(null);
          }}
        />
      )}
      <ModalError isOpen={errorModalOpen} onClose={() => setErrorModalOpen(false)} message={errorMessage} />
      <ModalSeleccionarProveedor
        isOpen={showProveedorModal}
        onClose={() => setShowProveedorModal(false)}
        onSelect={(proveedor: any) => {
          setProveedorSeleccionado(proveedor);
          setShowProveedorModal(false);
        }}
      />
      <ModalSeleccionarCategoria
        isOpen={categoriaModalIndex !== null}
        onClose={() => setCategoriaModalIndex(null)}
        onSelect={(categoria: any) => {
          if (categoriaModalIndex !== null) {
            actualizarFila(categoriaModalIndex, { idcategoria: String(categoria.idcategorias) });
            setCategoriasElegidas((prev) => ({ ...prev, [categoriaModalIndex]: categoria }));
          }
          setCategoriaModalIndex(null);
        }}
      />
    </div>
  );
};

export default CargarFacturaIA;
