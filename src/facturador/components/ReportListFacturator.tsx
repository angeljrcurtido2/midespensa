import { useState, useMemo } from "react";
import type { ReporteFacturadores as ReporteFacturadoresType } from "../../types/reporte.types";
import {
  Search,
  Filter,
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Grid3x3,
  List,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Building2,
  Calendar,
  BarChart3,
} from "lucide-react";

interface ReportListFacturatorComponentProps {
  reporte: ReporteFacturadoresType;
  onClose: () => void;
  onDownloadPDF?: (estadoFiltro: string) => void;
}

type VistaType = "tabla" | "tarjetas";
type OrdenType = "nombre" | "ruc" | "timbrado" | "estado" | "ventas" | "monto" | "facturas";
type DireccionOrden = "asc" | "desc";

export const ReportListFacturator = ({
  reporte,
  onClose,
  onDownloadPDF,
}: ReportListFacturatorComponentProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [ciudadFiltro, setCiudadFiltro] = useState<string>("todas");
  const [vista, setVista] = useState<VistaType>("tabla");
  const [orden, setOrden] = useState<OrdenType>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extraer valores únicos para filtros
  const filtrosUnicos = useMemo(() => {
    const ciudades = new Set(
      reporte.facturadores
        .map((f) => f.ciudad)
        .filter((c) => c && c.trim() !== "" && c !== "Sin ciudad")
    );

    return {
      ciudades: Array.from(ciudades).sort(),
    };
  }, [reporte.facturadores]);

  // Filtrar y ordenar facturadores
  const facturadoresFiltrados = useMemo(() => {
    let facturadores = [...reporte.facturadores];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      facturadores = facturadores.filter(
        (f) =>
          (f.nombre_fantasia || "").toLowerCase().includes(busquedaLower) ||
          (f.titular || "").toLowerCase().includes(busquedaLower) ||
          (f.ruc || "").toLowerCase().includes(busquedaLower) ||
          (f.timbrado_nro || "").toLowerCase().includes(busquedaLower) ||
          (f.telefono || "").toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de estado
    if (estadoFiltro !== "todos") {
      facturadores = facturadores.filter((f) => {
        if (estadoFiltro === "activo") {
          return f.culminado === "Activo";
        } else if (estadoFiltro === "culminado") {
          return f.culminado === "Culminado";
        }
        return true;
      });
    }

    // Filtro de ciudad
    if (ciudadFiltro !== "todas") {
      facturadores = facturadores.filter((f) => f.ciudad === ciudadFiltro);
    }

    // Ordenamiento
    facturadores.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (orden) {
        case "nombre":
          valorA = (a.nombre_fantasia || "").toLowerCase();
          valorB = (b.nombre_fantasia || "").toLowerCase();
          break;
        case "ruc":
          valorA = a.ruc || "";
          valorB = b.ruc || "";
          break;
        case "timbrado":
          valorA = a.timbrado_nro || "";
          valorB = b.timbrado_nro || "";
          break;
        case "estado":
          valorA = (a.culminado || "").toLowerCase();
          valorB = (b.culminado || "").toLowerCase();
          break;
        case "ventas":
          valorA = a.total_ventas || 0;
          valorB = b.total_ventas || 0;
          break;
        case "monto":
          valorA = a.monto_total_facturado_raw || 0;
          valorB = b.monto_total_facturado_raw || 0;
          break;
        case "facturas":
          valorA = parseFloat(a.porcentaje_uso) || 0;
          valorB = parseFloat(b.porcentaje_uso) || 0;
          break;
      }

      if (valorA < valorB) return direccionOrden === "asc" ? -1 : 1;
      if (valorA > valorB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    return facturadores;
  }, [
    reporte.facturadores,
    busqueda,
    estadoFiltro,
    ciudadFiltro,
    orden,
    direccionOrden,
  ]);

  // Estadísticas de facturadores filtrados
  const estadisticasFiltradas = useMemo(() => {
    const totalFacturadores = facturadoresFiltrados.length;
    const activos = facturadoresFiltrados.filter((f) => f.culminado === "Activo").length;
    const culminados = facturadoresFiltrados.filter((f) => f.culminado === "Culminado").length;
    const totalVentas = facturadoresFiltrados.reduce(
      (acc, f) => acc + (f.total_ventas || 0),
      0
    );

    return {
      totalFacturadores,
      activos,
      culminados,
      totalVentas,
    };
  }, [facturadoresFiltrados]);

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
    setEstadoFiltro("todos");
    setCiudadFiltro("todas");
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{reporte.titulo}</h2>
              <p className="text-blue-100 text-sm">
                Reporte detallado de facturadores registrados
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
                <FileText className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Total Facturadores</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalFacturadores}
              </p>
              <p className="text-xs text-blue-200">
                de {reporte.total_facturadores} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Activos</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.activos}
              </p>
              <p className="text-xs text-blue-200">
                de {reporte.facturadores_activos} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Culminados</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.culminados}
              </p>
              <p className="text-xs text-blue-200">
                de {reporte.facturadores_culminados} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Total Ventas</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalVentas}
              </p>
              <p className="text-xs text-blue-200">ventas realizadas</p>
            </div>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Buscador */}
            <div className="flex-1 min-w-[250px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUC, timbrado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mostrarFiltros
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-100"
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
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVista("tarjetas")}
                  className={`px-3 py-2 transition-colors border-l dark:border-gray-600 ${
                    vista === "tarjetas"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              {onDownloadPDF && (
                <button
                  onClick={() => onDownloadPDF(estadoFiltro)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
              )}
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="culminado">Culminado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <select
                    value={ciudadFiltro}
                    onChange={(e) => setCiudadFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las ciudades</option>
                    {filtrosUnicos.ciudades.map((ciudad) => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4">
          {facturadoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">No se encontraron facturadores</p>
              <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : vista === "tabla" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      ID
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("nombre")}
                    >
                      Nombre Fantasía
                      <IconoOrden columna="nombre" />
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("ruc")}
                    >
                      RUC
                      <IconoOrden columna="ruc" />
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("timbrado")}
                    >
                      Timbrado
                      <IconoOrden columna="timbrado" />
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Vigencia
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("ventas")}
                    >
                      Ventas
                      <IconoOrden columna="ventas" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("facturas")}
                    >
                      Uso Facturas
                      <IconoOrden columna="facturas" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      onClick={() => cambiarOrden("estado")}
                    >
                      Estado
                      <IconoOrden columna="estado" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {facturadoresFiltrados.map((facturador, index) => (
                    <tr
                      key={facturador.idfacturador}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-750"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {facturador.idfacturador}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {facturador.nombre_fantasia}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {facturador.titular}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {facturador.ruc}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                        {facturador.timbrado_nro}
                      </td>
                      <td className="p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div>{facturador.fecha_inicio_vigente}</div>
                          <div>{facturador.fecha_fin_vigente}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {facturador.total_ventas}
                        </span>
                        {facturador.monto_total_facturado && (
                          <p className="text-xs text-gray-500 mt-1">
                            ₲ {facturador.monto_total_facturado}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {facturador.porcentaje_uso}%
                          </span>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(parseFloat(facturador.porcentaje_uso), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {facturador.facturas_utilizadas}/{facturador.total_facturas_habilitadas}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            facturador.culminado === "Activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {facturador.culminado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facturadoresFiltrados.map((facturador) => (
                <div
                  key={facturador.idfacturador}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          ID: {facturador.idfacturador}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        facturador.culminado === "Activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {facturador.culminado}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {facturador.nombre_fantasia}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{facturador.titular}</p>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        RUC: {facturador.ruc}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <BarChart3 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Timbrado: {facturador.timbrado_nro}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {facturador.telefono}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {facturador.ciudad}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {facturador.fecha_inicio_vigente} - {facturador.fecha_fin_vigente}
                      </span>
                    </div>
                  </div>

                  <div className="border-t dark:border-gray-700 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Total Ventas:</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {facturador.total_ventas}
                      </span>
                    </div>
                    {facturador.monto_total_facturado && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Monto Facturado:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          ₲ {facturador.monto_total_facturado}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Uso Facturas:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {facturador.porcentaje_uso}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(parseFloat(facturador.porcentaje_uso), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Mostrando{" "}
              <span className="font-semibold">{facturadoresFiltrados.length}</span>{" "}
              de <span className="font-semibold">{reporte.total_facturadores}</span>{" "}
              facturadores
            </p>
            <p className="text-xs">
              {estadoFiltro !== "todos" ||
              ciudadFiltro !== "todas" ||
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
