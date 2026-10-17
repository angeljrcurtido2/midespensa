import { useState, useMemo } from "react";
import type { ReporteCompras as ReporteComprasType } from "../../types/reporte.types";
import {
  Search,
  Filter,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Wallet,
  Grid3x3,
  List,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
  Building2,
  Package,
} from "lucide-react";

interface ReporteComprasComponentProps {
  reporte: ReporteComprasType;
  onClose: () => void;
  onDownloadPDF?: (tipoFiltro: string) => void;
  ventana?: boolean;
}

type VistaType = "tabla" | "tarjetas";
type OrdenType = "fecha" | "proveedor" | "total" | "tipo" | "cantidad";
type DireccionOrden = "asc" | "desc";

export const ReporteCompras = ({
  reporte,
  onClose,
  onDownloadPDF,
  ventana = false,
}: ReporteComprasComponentProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [proveedorFiltro, setProveedorFiltro] = useState<string>("todos");
  const [vista, setVista] = useState<VistaType>("tabla");
  const [orden, setOrden] = useState<OrdenType>("fecha");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extraer valores únicos para filtros
  const filtrosUnicos = useMemo(() => {
    const proveedores = new Set(
      reporte.compras
        .map((c) => c.proveedor_nombre)
        .filter((p) => p && p.trim() !== "")
    );

    return {
      proveedores: Array.from(proveedores).sort(),
    };
  }, [reporte.compras]);

  // Filtrar y ordenar compras
  const comprasFiltradas = useMemo(() => {
    let compras = [...reporte.compras];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      compras = compras.filter(
        (c) =>
          (c.nro_factura || "").toLowerCase().includes(busquedaLower) ||
          (c.proveedor_nombre || "").toLowerCase().includes(busquedaLower) ||
          (c.proveedor_ruc || "").toLowerCase().includes(busquedaLower) ||
          (c.cajero_nombre || "").toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de tipo
    if (tipoFiltro !== "todos") {
      compras = compras.filter((c) => c.tipo.toLowerCase() === tipoFiltro.toLowerCase());
    }

    // Filtro de proveedor
    if (proveedorFiltro !== "todos") {
      compras = compras.filter((c) => c.proveedor_nombre === proveedorFiltro);
    }

    // Ordenamiento
    compras.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (orden) {
        case "fecha":
          valorA = a.fecha ? new Date(a.fecha.split("/").reverse().join("-")).getTime() : 0;
          valorB = b.fecha ? new Date(b.fecha.split("/").reverse().join("-")).getTime() : 0;
          break;
        case "proveedor":
          valorA = (a.proveedor_nombre || "").toLowerCase();
          valorB = (b.proveedor_nombre || "").toLowerCase();
          break;
        case "total":
          valorA = a.total_raw || 0;
          valorB = b.total_raw || 0;
          break;
        case "tipo":
          valorA = (a.tipo || "").toLowerCase();
          valorB = (b.tipo || "").toLowerCase();
          break;
        case "cantidad":
          valorA = a.cantidad_total_productos || 0;
          valorB = b.cantidad_total_productos || 0;
          break;
      }

      if (valorA < valorB) return direccionOrden === "asc" ? -1 : 1;
      if (valorA > valorB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    return compras;
  }, [
    reporte.compras,
    busqueda,
    tipoFiltro,
    proveedorFiltro,
    orden,
    direccionOrden,
  ]);

  // Estadísticas de compras filtradas
  const estadisticasFiltradas = useMemo(() => {
    const totalCompras = comprasFiltradas.length;
    const contado = comprasFiltradas.filter((c) => c.tipo.toLowerCase() === "contado").length;
    const credito = comprasFiltradas.filter((c) => c.tipo.toLowerCase() === "credito").length;
    const montoTotal = comprasFiltradas.reduce(
      (acc, c) => acc + (c.total_raw || 0),
      0
    );

    return {
      totalCompras,
      contado,
      credito,
      montoTotal: montoTotal.toLocaleString("es-PY"),
    };
  }, [comprasFiltradas]);

  const cambiarOrden = (nuevoOrden: OrdenType) => {
    if (orden === nuevoOrden) {
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
    } else {
      setOrden(nuevoOrden);
      setDireccionOrden("asc");
    }
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setTipoFiltro("todos");
    setProveedorFiltro("todos");
  };

  const IconoOrden = ({ columna }: { columna: OrdenType }) => {
    if (orden !== columna) return null;
    return direccionOrden === "asc" ? (
      <ChevronUp className="inline w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="inline w-4 h-4 ml-1" />
    );
  };

  return (
    <div className={ventana ? 'min-h-screen bg-slate-50 p-4 dark:bg-gray-900' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-7xl ${ventana ? 'min-h-[80vh]' : 'max-h-[95vh]'} flex flex-col animate-in fade-in duration-200`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{reporte.titulo}</h2>
              <p className="text-green-100 text-sm">
                Reporte detallado de compras realizadas
                {reporte.fecha_inicio && reporte.fecha_fin && (
                  <span> • {reporte.fecha_inicio} - {reporte.fecha_fin}</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-5 h-5 text-green-200" />
                <span className="text-sm text-green-100">Total Compras</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalCompras}
              </p>
              <p className="text-xs text-green-200">
                de {reporte.total_compras} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-5 h-5 text-green-200" />
                <span className="text-sm text-green-100">Contado</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.contado}
              </p>
              <p className="text-xs text-green-200">
                de {reporte.compras_contado} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-green-200" />
                <span className="text-sm text-green-100">Crédito</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.credito}
              </p>
              <p className="text-xs text-green-200">
                de {reporte.compras_credito} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-green-200" />
                <span className="text-sm text-green-100">Monto Total</span>
              </div>
              <p className="text-2xl font-bold">
                ₲ {estadisticasFiltradas.montoTotal}
              </p>
              <p className="text-xs text-green-200">compras realizadas</p>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Buscador */}
            <div className="flex-1 min-w-[250px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por factura, proveedor, RUC..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mostrarFiltros
                    ? "bg-green-600 text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setVista("tabla")}
                  className={`px-3 py-2 transition-colors ${
                    vista === "tabla"
                      ? "bg-green-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVista("tarjetas")}
                  className={`px-3 py-2 transition-colors border-l ${
                    vista === "tarjetas"
                      ? "bg-green-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              {onDownloadPDF && (
                <button
                  onClick={() => onDownloadPDF(tipoFiltro)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              )}
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Compra
                  </label>
                  <select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los tipos</option>
                    <option value="contado">Contado</option>
                    <option value="credito">Crédito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={proveedorFiltro}
                    onChange={(e) => setProveedorFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los proveedores</option>
                    {filtrosUnicos.proveedores.map((proveedor) => (
                      <option key={proveedor} value={proveedor}>
                        {proveedor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4">
          {comprasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron compras</p>
              <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : vista === "tabla" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      N° Factura
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("fecha")}
                    >
                      Fecha
                      <IconoOrden columna="fecha" />
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("proveedor")}
                    >
                      Proveedor
                      <IconoOrden columna="proveedor" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("tipo")}
                    >
                      Tipo
                      <IconoOrden columna="tipo" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("cantidad")}
                    >
                      Productos
                      <IconoOrden columna="cantidad" />
                    </th>
                    <th
                      className="text-right p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("total")}
                    >
                      Total
                      <IconoOrden columna="total" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.map((compra, index) => (
                    <tr
                      key={compra.idcompra}
                      className={`border-b border-gray-100 hover:bg-green-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {compra.idcompra}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {compra.nro_factura}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {compra.fecha}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {compra.proveedor_nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            RUC: {compra.proveedor_ruc}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            compra.tipo.toLowerCase() === "contado"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {compra.tipo}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {compra.cantidad_total_productos} unidades
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₲ {compra.total}
                        </p>
        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comprasFiltradas.map((compra) => (
                <div
                  key={compra.idcompra}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          ID: {compra.idcompra}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        compra.tipo.toLowerCase() === "contado"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {compra.tipo}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Factura: {compra.nro_factura}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {compra.fecha}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {compra.proveedor_nombre}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {compra.cantidad_total_productos} productos
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        ₲ {compra.total}
                      </span>
                    </div>
                    {compra.descuento_raw && compra.descuento_raw > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Descuento:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ₲ {compra.descuento}
                        </span>
                      </div>
                    )}
                  </div>

                  {compra.observacion && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        Obs: {compra.observacion}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <p>
              Mostrando{" "}
              <span className="font-semibold">{comprasFiltradas.length}</span>{" "}
              de <span className="font-semibold">{reporte.total_compras}</span>{" "}
              compras
            </p>
            <p className="text-xs">
              {tipoFiltro !== "todos" ||
              proveedorFiltro !== "todos" ||
              busqueda
                ? "Filtros activos"
                : "Sin filtros aplicados"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
