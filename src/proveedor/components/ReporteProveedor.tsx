import { useState, useMemo } from "react";
import type { ReporteProveedores as ReporteProveedoresType } from "../../types/reporte.types";
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Grid3x3,
  List,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Building2,
  FileText,
} from "lucide-react";

interface ReporteProveedorComponentProps {
  reporte: ReporteProveedoresType;
  onClose: () => void;
  onDownloadPDF?: () => void;
}

type VistaType = "tabla" | "tarjetas";
type OrdenType = "nombre" | "ruc" | "direccion" | "estado" | "fecha" | "compras";
type DireccionOrden = "asc" | "desc";

export const ReporteProveedor = ({
  reporte,
  onClose,
  onDownloadPDF,
}: ReporteProveedorComponentProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [direccionFiltro, setDireccionFiltro] = useState<string>("todas");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [vista, setVista] = useState<VistaType>("tabla");
  const [orden, setOrden] = useState<OrdenType>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extraer valores únicos para filtros
  const filtrosUnicos = useMemo(() => {
    const direcciones = new Set(
      reporte.proveedores
        .map((p) => p.direccion)
        .filter((d) => d && d.trim() !== "" && d !== "Sin dirección")
    );

    return {
      direcciones: Array.from(direcciones).sort(),
    };
  }, [reporte.proveedores]);

  // Filtrar y ordenar proveedores
  const proveedoresFiltrados = useMemo(() => {
    let proveedores = [...reporte.proveedores];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      proveedores = proveedores.filter(
        (p) =>
          (p.nombre || "").toLowerCase().includes(busquedaLower) ||
          (p.ruc || "").toLowerCase().includes(busquedaLower) ||
          (p.razon || "").toLowerCase().includes(busquedaLower) ||
          (p.telefono || "").toLowerCase().includes(busquedaLower) ||
          (p.direccion || "").toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de dirección
    if (direccionFiltro !== "todas") {
      proveedores = proveedores.filter((p) => p.direccion === direccionFiltro);
    }

    // Filtro de estado
    if (estadoFiltro !== "todos") {
      proveedores = proveedores.filter((p) => p.estado === estadoFiltro);
    }

    // Ordenamiento
    proveedores.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (orden) {
        case "nombre":
          valorA = (a.nombre || "").toLowerCase();
          valorB = (b.nombre || "").toLowerCase();
          break;
        case "ruc":
          valorA = a.ruc || "";
          valorB = b.ruc || "";
          break;
        case "direccion":
          valorA = (a.direccion || "").toLowerCase();
          valorB = (b.direccion || "").toLowerCase();
          break;
        case "estado":
          valorA = (a.estado || "").toLowerCase();
          valorB = (b.estado || "").toLowerCase();
          break;
        case "fecha":
          valorA = a.created_at ? new Date(a.created_at.split("/").reverse().join("-")).getTime() : 0;
          valorB = b.created_at ? new Date(b.created_at.split("/").reverse().join("-")).getTime() : 0;
          break;
        case "compras":
          valorA = a.total_compras || 0;
          valorB = b.total_compras || 0;
          break;
      }

      if (valorA < valorB) return direccionOrden === "asc" ? -1 : 1;
      if (valorA > valorB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    return proveedores;
  }, [
    reporte.proveedores,
    busqueda,
    direccionFiltro,
    estadoFiltro,
    orden,
    direccionOrden,
  ]);

  // Estadísticas de proveedores filtrados
  const estadisticasFiltradas = useMemo(() => {
    const totalProveedores = proveedoresFiltrados.length;
    const activos = proveedoresFiltrados.filter((p) => p.estado === "activo").length;
    const inactivos = proveedoresFiltrados.filter((p) => p.estado === "inactivo").length;
    const totalCompras = proveedoresFiltrados.reduce(
      (acc, p) => acc + (p.total_compras || 0),
      0
    );

    return {
      totalProveedores,
      activos,
      inactivos,
      totalCompras,
    };
  }, [proveedoresFiltrados]);

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
    setDireccionFiltro("todas");
    setEstadoFiltro("todos");
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{reporte.titulo}</h2>
              <p className="text-orange-100 text-sm">
                Reporte detallado de proveedores registrados
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
                <Users className="w-5 h-5 text-orange-200" />
                <span className="text-sm text-orange-100">Total Proveedores</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalProveedores}
              </p>
              <p className="text-xs text-orange-200">
                de {reporte.total_proveedores} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="w-5 h-5 text-orange-200" />
                <span className="text-sm text-orange-100">Activos</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.activos}
              </p>
              <p className="text-xs text-orange-200">
                de {reporte.proveedores_activos} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserX className="w-5 h-5 text-orange-200" />
                <span className="text-sm text-orange-100">Inactivos</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.inactivos}
              </p>
              <p className="text-xs text-orange-200">
                de {reporte.proveedores_inactivos} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-orange-200" />
                <span className="text-sm text-orange-100">Total Compras</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalCompras}
              </p>
              <p className="text-xs text-orange-200">compras realizadas</p>
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
                placeholder="Buscar por nombre, RUC, razón social..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mostrarFiltros
                    ? "bg-orange-600 text-white"
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
                      ? "bg-orange-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVista("tarjetas")}
                  className={`px-3 py-2 transition-colors border-l ${
                    vista === "tarjetas"
                      ? "bg-orange-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              {onDownloadPDF && (
                <button
                  onClick={onDownloadPDF}
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
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <select
                    value={direccionFiltro}
                    onChange={(e) => setDireccionFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las direcciones</option>
                    {filtrosUnicos.direcciones.map((direccion) => (
                      <option key={direccion} value={direccion}>
                        {direccion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
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
          {proveedoresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Users className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron proveedores</p>
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
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("nombre")}
                    >
                      Nombre
                      <IconoOrden columna="nombre" />
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("ruc")}
                    >
                      RUC
                      <IconoOrden columna="ruc" />
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Razón Social
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Contacto
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("direccion")}
                    >
                      Dirección
                      <IconoOrden columna="direccion" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("compras")}
                    >
                      Compras
                      <IconoOrden columna="compras" />
                    </th>
                    <th
                      className="text-center p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("estado")}
                    >
                      Estado
                      <IconoOrden columna="estado" />
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("fecha")}
                    >
                      Fecha Registro
                      <IconoOrden columna="fecha" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresFiltrados.map((proveedor, index) => (
                    <tr
                      key={proveedor.idproveedor}
                      className={`border-b border-gray-100 hover:bg-orange-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {proveedor.idproveedor}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {proveedor.nombre}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {proveedor.ruc}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {proveedor.razon}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {proveedor.telefono}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {proveedor.direccion}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {proveedor.total_compras || 0}
                        </span>
                        {proveedor.monto_total_comprado && (
                          <p className="text-xs text-gray-500 mt-1">
                            ₲ {proveedor.monto_total_comprado}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            proveedor.estado === "activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {proveedor.estado}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {proveedor.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedoresFiltrados.map((proveedor) => (
                <div
                  key={proveedor.idproveedor}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          ID: {proveedor.idproveedor}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        proveedor.estado === "activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {proveedor.estado}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {proveedor.nombre}
                  </h3>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        RUC: {proveedor.ruc}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {proveedor.razon}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {proveedor.telefono}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {proveedor.direccion}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Compras:</span>
                      <span className="text-sm font-bold text-orange-600">
                        {proveedor.total_compras || 0}
                      </span>
                    </div>
                    {proveedor.monto_total_comprado && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Monto Total:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ₲ {proveedor.monto_total_comprado}
                        </span>
                      </div>
                    )}
                    {proveedor.ultima_compra && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Última Compra:</span>
                        <span className="text-xs text-gray-600">
                          {proveedor.ultima_compra}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Registrado: {proveedor.created_at}
                    </p>
                  </div>
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
              <span className="font-semibold">{proveedoresFiltrados.length}</span>{" "}
              de <span className="font-semibold">{reporte.total_proveedores}</span>{" "}
              proveedores
            </p>
            <p className="text-xs">
              {direccionFiltro !== "todas" ||
              estadoFiltro !== "todos" ||
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
