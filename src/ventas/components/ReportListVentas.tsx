import { useState, useMemo } from "react";
import type { ReporteVentas as ReporteVentasType } from "../../types/reporte.types";
import {
  Search,
  Filter,
  ShoppingBag,
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
  User,
  Package,
} from "lucide-react";

interface ReporteVentasComponentProps {
  reporte: ReporteVentasType;
  onClose: () => void;
  onDownloadPDF?: (tipoFiltro: string) => void;
}

type VistaType = "tabla" | "tarjetas";
type OrdenType = "fecha" | "cliente" | "total" | "tipo" | "ganancia" | "cantidad";
type DireccionOrden = "asc" | "desc";

export const ReportListVentas = ({
  reporte,
  onClose,
  onDownloadPDF,
}: ReporteVentasComponentProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [clienteFiltro, setClienteFiltro] = useState<string>("todos");
  const [vista, setVista] = useState<VistaType>("tabla");
  const [orden, setOrden] = useState<OrdenType>("fecha");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extraer valores únicos para filtros
  const filtrosUnicos = useMemo(() => {
    const clientes = new Set(
      reporte.ventas
        .map((v) => v.cliente_nombre)
        .filter((c) => c && c.trim() !== "")
    );

    return {
      clientes: Array.from(clientes).sort(),
    };
  }, [reporte.ventas]);

  // Filtrar y ordenar ventas
  const ventasFiltradas = useMemo(() => {
    let ventas = [...reporte.ventas];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      ventas = ventas.filter(
        (v) =>
          (v.nro_factura || "").toLowerCase().includes(busquedaLower) ||
          (v.cliente_nombre || "").toLowerCase().includes(busquedaLower) ||
          (v.cliente_documento || "").toLowerCase().includes(busquedaLower) ||
          (v.cajero_nombre || "").toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de tipo
    if (tipoFiltro !== "todos") {
      ventas = ventas.filter((v) => v.tipo.toLowerCase() === tipoFiltro.toLowerCase());
    }

    // Filtro de cliente
    if (clienteFiltro !== "todos") {
      ventas = ventas.filter((v) => v.cliente_nombre === clienteFiltro);
    }

    // Ordenamiento
    ventas.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (orden) {
        case "fecha":
          valorA = a.fecha ? new Date(a.fecha.split("/").reverse().join("-")).getTime() : 0;
          valorB = b.fecha ? new Date(b.fecha.split("/").reverse().join("-")).getTime() : 0;
          break;
        case "cliente":
          valorA = (a.cliente_nombre || "").toLowerCase();
          valorB = (b.cliente_nombre || "").toLowerCase();
          break;
        case "total":
          valorA = a.total_raw || 0;
          valorB = b.total_raw || 0;
          break;
        case "tipo":
          valorA = (a.tipo || "").toLowerCase();
          valorB = (b.tipo || "").toLowerCase();
          break;
        case "ganancia":
          valorA = a.ganancia_raw || 0;
          valorB = b.ganancia_raw || 0;
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

    return ventas;
  }, [
    reporte.ventas,
    busqueda,
    tipoFiltro,
    clienteFiltro,
    orden,
    direccionOrden,
  ]);

  // Estadísticas de ventas filtradas
  const estadisticasFiltradas = useMemo(() => {
    const totalVentas = ventasFiltradas.length;
    const contado = ventasFiltradas.filter((v) => v.tipo.toLowerCase() === "contado").length;
    const credito = ventasFiltradas.filter((v) => v.tipo.toLowerCase() === "credito").length;
    const montoTotal = ventasFiltradas.reduce(
      (acc, v) => acc + (v.total_raw || 0),
      0
    );
    const gananciaTotal = ventasFiltradas.reduce(
      (acc, v) => acc + (v.ganancia_raw || 0),
      0
    );

    return {
      totalVentas,
      contado,
      credito,
      montoTotal: montoTotal.toLocaleString("es-PY"),
      gananciaTotal: gananciaTotal.toLocaleString("es-PY"),
    };
  }, [ventasFiltradas]);

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
    setClienteFiltro("todos");
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
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-gray-800 text-white p-6 rounded-t-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{reporte.titulo}</h2>
            <p className="text-blue-100 dark:text-gray-400 text-sm">
              Reporte detallado de ventas realizadas
              {reporte.fecha_inicio && reporte.fecha_fin && (
                <span> • {reporte.fecha_inicio} - {reporte.fecha_fin}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 dark:bg-gray-700 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-5 h-5 text-blue-200 dark:text-gray-400" />
              <span className="text-sm text-blue-100 dark:text-gray-300">Total Ventas</span>
            </div>
            <p className="text-2xl font-bold">
              {estadisticasFiltradas.totalVentas}
            </p>
            <p className="text-xs text-blue-200 dark:text-gray-400">
              de {reporte.total_ventas} totales
            </p>
          </div>

          <div className="bg-white/10 dark:bg-gray-700 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-blue-200 dark:text-gray-400" />
              <span className="text-sm text-blue-100 dark:text-gray-300">Contado</span>
            </div>
            <p className="text-2xl font-bold">
              {estadisticasFiltradas.contado}
            </p>
            <p className="text-xs text-blue-200 dark:text-gray-400">
              de {reporte.ventas_contado} totales
            </p>
          </div>

          <div className="bg-white/10 dark:bg-gray-700 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-blue-200 dark:text-gray-400" />
              <span className="text-sm text-blue-100 dark:text-gray-300">Crédito</span>
            </div>
            <p className="text-2xl font-bold">
              {estadisticasFiltradas.credito}
            </p>
            <p className="text-xs text-blue-200 dark:text-gray-400">
              de {reporte.ventas_credito} totales
            </p>
          </div>

          <div className="bg-white/10 dark:bg-gray-700 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-blue-200 dark:text-gray-400" />
              <span className="text-sm text-blue-100 dark:text-gray-300">Monto Total</span>
            </div>
            <p className="text-2xl font-bold">
              ₲ {estadisticasFiltradas.montoTotal}
            </p>
            <p className="text-xs text-blue-200 dark:text-gray-400">
              Ganancia: ₲ {estadisticasFiltradas.gananciaTotal}
            </p>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Buscador */}
          <div className="flex-1 min-w-[250px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por factura, cliente, documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                mostrarFiltros
                  ? "bg-blue-600 dark:bg-gray-700 text-white"
                  : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setVista("tabla")}
                className={`px-3 py-2 transition-colors ${
                  vista === "tabla"
                    ? "bg-blue-600 dark:bg-gray-700 text-white"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setVista("tarjetas")}
                className={`px-3 py-2 transition-colors border-l dark:border-gray-600 ${
                  vista === "tarjetas"
                    ? "bg-blue-600 dark:bg-gray-700 text-white"
                    : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
            </div>

            {onDownloadPDF && (
              <button
                onClick={() => onDownloadPDF(tipoFiltro)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-gray-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-gray-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            )}
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {mostrarFiltros && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Venta
                </label>
                <select
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliente
                </label>
                <select
                  value={clienteFiltro}
                  onChange={(e) => setClienteFiltro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos los clientes</option>
                  {filtrosUnicos.clientes.map((cliente) => (
                    <option key={cliente} value={cliente}>
                      {cliente}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-4">
        {ventasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <ShoppingBag className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">No se encontraron ventas</p>
            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : vista === "tabla" ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ID
                  </th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    N° Factura
                  </th>
                  <th
                    className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("fecha")}
                  >
                    Fecha
                    <IconoOrden columna="fecha" />
                  </th>
                  <th
                    className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("cliente")}
                  >
                    Cliente
                    <IconoOrden columna="cliente" />
                  </th>
                  <th
                    className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("tipo")}
                  >
                    Tipo
                    <IconoOrden columna="tipo" />
                  </th>
                  <th
                    className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("cantidad")}
                  >
                    Productos
                    <IconoOrden columna="cantidad" />
                  </th>
                  <th
                    className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("ganancia")}
                  >
                    Ganancia
                    <IconoOrden columna="ganancia" />
                  </th>
                  <th
                    className="text-right p-3 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => cambiarOrden("total")}
                  >
                    Total
                    <IconoOrden columna="total" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.map((venta, index) => (
                  <tr
                    key={venta.idventa}
                    className={`border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                      index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/50"
                    }`}
                  >
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {venta.idventa}
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-gray-200">
                        {venta.nro_factura}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      {venta.fecha}
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {venta.cliente_nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Doc: {venta.cliente_documento}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          venta.tipo.toLowerCase() === "contado"
                            ? "bg-green-100 dark:bg-gray-700 text-green-800 dark:text-gray-200"
                            : "bg-yellow-100 dark:bg-gray-700 text-yellow-800 dark:text-gray-200"
                        }`}
                      >
                        {venta.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-gray-700 text-purple-800 dark:text-gray-200">
                        {venta.cantidad_total_productos} unidades
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <p className="text-sm font-medium text-green-600 dark:text-gray-300">
                        ₲ {venta.ganancia_total}
                      </p>
                    </td>
                    <td className="p-3 text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                        ₲ {venta.total}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ventasFiltradas.map((venta) => (
              <div
                key={venta.idventa}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        ID: {venta.idventa}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      venta.tipo.toLowerCase() === "contado"
                        ? "bg-green-100 dark:bg-gray-700 text-green-800 dark:text-gray-200"
                        : "bg-yellow-100 dark:bg-gray-700 text-yellow-800 dark:text-gray-200"
                    }`}
                  >
                    {venta.tipo}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Factura: {venta.nro_factura}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {venta.fecha}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {venta.cliente_nombre}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {venta.cantidad_total_productos} productos
                    </span>
                  </div>
                </div>

                <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Ganancia:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-gray-300">
                      ₲ {venta.ganancia_total}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Total:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-gray-200">
                      ₲ {venta.total}
                    </span>
                  </div>
                  {venta.descuento_raw && venta.descuento_raw > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Descuento:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        ₲ {venta.descuento_aplicado}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Mostrando{" "}
            <span className="font-semibold">{ventasFiltradas.length}</span>{" "}
            de <span className="font-semibold">{reporte.total_ventas}</span>{" "}
            ventas
          </p>
          <p className="text-xs">
            {tipoFiltro !== "todos" ||
            clienteFiltro !== "todos" ||
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
