import { useState, useMemo } from "react";
import type { ReporteInventario } from "../../types/reporte.types";
import {
  Search,
  Filter,
  Package,
  TrendingUp,
  TrendingDown,
  Grid3x3,
  List,
  Download,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface InventarioProductoProps {
  reporte: ReporteInventario;
  onClose: () => void;
  onDownloadPDF: () => void;
}

type VistaType = "tabla" | "tarjetas";
type OrdenType = "nombre" | "stock" | "precio" | "categoria" | "valor";
type DireccionOrden = "asc" | "desc";

export const InventarioProducto = ({
  reporte,
  onClose,
  onDownloadPDF,
}: InventarioProductoProps) => {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [stockMinimo, setStockMinimo] = useState<number | "">("");
  const [stockMaximo, setStockMaximo] = useState<number | "">("");
  const [vista, setVista] = useState<VistaType>("tabla");
  const [orden, setOrden] = useState<OrdenType>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Extraer categorías únicas
  const categorias = useMemo(() => {
    const cats = new Set(
      reporte.productos.map((p) => p.nombre_categoria)
    );
    return Array.from(cats).sort();
  }, [reporte.productos]);

  // Filtrar y ordenar productos
  const productosFiltrados = useMemo(() => {
    let productos = [...reporte.productos];

    // Filtro de búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase();
      productos = productos.filter(
        (p) =>
          p.nombre_producto.toLowerCase().includes(busquedaLower) ||
          p.cod_barra.toLowerCase().includes(busquedaLower) ||
          p.ubicacion.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtro de categoría
    if (categoriaFiltro !== "todas") {
      productos = productos.filter(
        (p) => p.nombre_categoria === categoriaFiltro
      );
    }

    // Filtro de estado
    if (estadoFiltro !== "todos") {
      productos = productos.filter((p) => p.estado === estadoFiltro);
    }

    // Filtro de stock mínimo
    if (stockMinimo !== "") {
      productos = productos.filter((p) => p.stock >= Number(stockMinimo));
    }

    // Filtro de stock máximo
    if (stockMaximo !== "") {
      productos = productos.filter((p) => p.stock <= Number(stockMaximo));
    }

    // Ordenamiento
    productos.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (orden) {
        case "nombre":
          valorA = a.nombre_producto.toLowerCase();
          valorB = b.nombre_producto.toLowerCase();
          break;
        case "stock":
          valorA = a.stock;
          valorB = b.stock;
          break;
        case "precio":
          valorA = parseFloat(a.precio_venta.replace(/\./g, ""));
          valorB = parseFloat(b.precio_venta.replace(/\./g, ""));
          break;
        case "categoria":
          valorA = a.nombre_categoria.toLowerCase();
          valorB = b.nombre_categoria.toLowerCase();
          break;
        case "valor":
          valorA = parseFloat(a.valor_total.replace(/\./g, ""));
          valorB = parseFloat(b.valor_total.replace(/\./g, ""));
          break;
      }

      if (valorA < valorB) return direccionOrden === "asc" ? -1 : 1;
      if (valorA > valorB) return direccionOrden === "asc" ? 1 : -1;
      return 0;
    });

    return productos;
  }, [
    reporte.productos,
    busqueda,
    categoriaFiltro,
    estadoFiltro,
    stockMinimo,
    stockMaximo,
    orden,
    direccionOrden,
  ]);

  // Estadísticas de productos filtrados
  const estadisticasFiltradas = useMemo(() => {
    const totalProductos = productosFiltrados.length;
    const totalStock = productosFiltrados.reduce((acc, p) => acc + p.stock, 0);
    const totalValor = productosFiltrados.reduce(
      (acc, p) => acc + parseFloat(p.valor_total.replace(/\./g, "")),
      0
    );

    return {
      totalProductos,
      totalStock,
      totalValor: totalValor.toLocaleString("es-PY"),
    };
  }, [productosFiltrados]);

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
    setCategoriaFiltro("todas");
    setEstadoFiltro("todos");
    setStockMinimo("");
    setStockMaximo("");
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{reporte.titulo}</h2>
              <p className="text-blue-100 text-sm">
                Reporte detallado del inventario de productos
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
                <Package className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Productos</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalProductos}
              </p>
              <p className="text-xs text-blue-200">
                de {reporte.total_productos} totales
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Grid3x3 className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Stock Total</span>
              </div>
              <p className="text-2xl font-bold">
                {estadisticasFiltradas.totalStock}
              </p>
              <p className="text-xs text-blue-200">unidades</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Valor Inventario</span>
              </div>
              <p className="text-2xl font-bold">
                ₲ {estadisticasFiltradas.totalValor}
              </p>
              <p className="text-xs text-blue-200">
                de ₲ {reporte.total_valor_inventario}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-blue-200" />
                <span className="text-sm text-blue-100">Stock en Cajas</span>
              </div>
              <p className="text-2xl font-bold">
                {reporte.total_stock_cajas.toFixed(2)}
              </p>
              <p className="text-xs text-blue-200">cajas</p>
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
                placeholder="Buscar por nombre, código o ubicación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mostrarFiltros
                    ? "bg-blue-600 text-white"
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
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setVista("tarjetas")}
                  className={`px-3 py-2 transition-colors border-l ${
                    vista === "tarjetas"
                      ? "bg-blue-600 text-white"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={onDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {mostrarFiltros && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 animate-in slide-in-from-top duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todas">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    value={stockMinimo}
                    onChange={(e) =>
                      setStockMinimo(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Ej: 0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    value={stockMaximo}
                    onChange={(e) =>
                      setStockMaximo(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Ej: 1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Package className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No se encontraron productos</p>
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
                      Producto
                      <IconoOrden columna="nombre" />
                    </th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-700">
                      Código
                    </th>
                    <th
                      className="text-left p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("categoria")}
                    >
                      Categoría
                      <IconoOrden columna="categoria" />
                    </th>
                    <th
                      className="text-right p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("stock")}
                    >
                      Stock
                      <IconoOrden columna="stock" />
                    </th>
                    <th
                      className="text-right p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("precio")}
                    >
                      Precio Venta
                      <IconoOrden columna="precio" />
                    </th>
                    <th
                      className="text-right p-3 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => cambiarOrden("valor")}
                    >
                      Valor Total
                      <IconoOrden columna="valor" />
                    </th>
                    <th className="text-center p-3 text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((producto, index) => (
                    <tr
                      key={producto.idproducto}
                      className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="p-3 text-sm text-gray-600">
                        {producto.idproducto}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {producto.nombre_producto}
                          </p>
                          <p className="text-xs text-gray-500">
                            {producto.ubicacion}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {producto.cod_barra}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {producto.nombre_categoria}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {producto.stock <= 5 ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          ) : producto.stock >= 50 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                          ) : null}
                          <span
                            className={`text-sm font-medium ${
                              producto.stock <= 5
                                ? "text-red-600"
                                : producto.stock >= 50
                                ? "text-green-600"
                                : "text-gray-900"
                            }`}
                          >
                            {producto.stock}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right text-sm text-gray-900">
                        ₲ {producto.precio_venta}
                      </td>
                      <td className="p-3 text-right text-sm font-medium text-gray-900">
                        ₲ {producto.valor_total}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            producto.estado === "activo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {producto.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.idproducto}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-medium text-gray-500">
                      ID: {producto.idproducto}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        producto.estado === "activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {producto.estado}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
                    {producto.nombre_producto}
                  </h3>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Categoría:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {producto.nombre_categoria}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Stock:</span>
                      <div className="flex items-center gap-1">
                        {producto.stock <= 5 ? (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        ) : producto.stock >= 50 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : null}
                        <span
                          className={`text-sm font-medium ${
                            producto.stock <= 5
                              ? "text-red-600"
                              : producto.stock >= 50
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {producto.stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Código:</span>
                      <span className="text-xs text-gray-900">
                        {producto.cod_barra}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Precio:</span>
                      <span className="text-sm font-medium text-gray-900">
                        ₲ {producto.precio_venta}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700">
                        Valor Total:
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        ₲ {producto.valor_total}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500 truncate">
                      📍 {producto.ubicacion}
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
              Mostrando <span className="font-semibold">{productosFiltrados.length}</span>{" "}
              de <span className="font-semibold">{reporte.total_productos}</span> productos
            </p>
            <p className="text-xs">
              {categoriaFiltro !== "todas" || estadoFiltro !== "todos" || busqueda || stockMinimo !== "" || stockMaximo !== ""
                ? "Filtros activos"
                : "Sin filtros aplicados"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
