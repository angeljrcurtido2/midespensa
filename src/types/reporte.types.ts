export interface EmpresaReporte {
  nombre_fantasia: string;
  ruc: string;
  timbrado_nro: string;
  fecha_inicio_vigente: string;
  fecha_fin_vigente: string;
  fecha_emision: string;
}

export interface ProductoReporte {
  idproducto: number;
  nombre_producto: string;
  cod_barra: string;
  precio_compra: string;
  precio_venta: string;
  precio_compra_caja: string | null;
  precio_venta_caja: string | null;
  stock: number;
  cant_cajas: number | null;
  cant_p_caja: number | null;
  idcategoria: number;
  nombre_categoria: string;
  ubicacion: string;
  iva: string;
  estado: string;
  unidad_medida: string;
  valor_total: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  ultima_fecha_vencimiento: string;
}

export interface ReporteInventario {
  titulo: string;
  total_productos: number;
  total_stock_unidades: number;
  total_stock_cajas: number;
  total_valor_inventario: string;
  productos: ProductoReporte[];
}

export interface DatosReporte {
  empresa: EmpresaReporte;
  reporte: ReporteInventario;
}

export interface ReporteResponse {
  message: string;
  reportePDFBase64: string;
  datosReporte: DatosReporte;
}

// Tipos para reporte de clientes
export interface ClienteReporte {
  idcliente: number;
  nombre: string;
  apellido: string;
  nro_documento: string;
  telefono: string;
  correo: string;
  direccion: string;
  ciudad: string;
  pais: string;
  tipo_documento: string;
  tipo_cliente?: string;
  estado: string;
  created_at: string;
  updated_at: string;
  total_compras?: number;
  monto_total_comprado?: string;
  ultima_compra?: string;
}

export interface ReporteClientes {
  titulo: string;
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  clientes: ClienteReporte[];
}

export interface DatosReporteClientes {
  empresa: EmpresaReporte;
  reporte: ReporteClientes;
}

export interface ReporteClientesResponse {
  message: string;
  reportePDFBase64?: string;
  datosReporte: DatosReporteClientes;
}

// Tipos para reporte de proveedores
export interface ProveedorReporte {
  idproveedor: number;
  nombre: string;
  telefono: string;
  direccion: string;
  ruc: string;
  razon: string;
  estado: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  idusuario: number;
  total_compras: number;
  monto_total_comprado: string;
  monto_total_comprado_raw?: number;
  ultima_compra: string;
}

export interface ReporteProveedores {
  titulo: string;
  total_proveedores: number;
  proveedores_activos: number;
  proveedores_inactivos: number;
  total_compras_general?: number;
  monto_total_comprado?: string;
  proveedores: ProveedorReporte[];
}

export interface DatosReporteProveedores {
  empresa: EmpresaReporte;
  reporte: ReporteProveedores;
}

export interface ReporteProveedoresResponse {
  message: string;
  reportePDFBase64?: string;
  datosReporte: DatosReporteProveedores;
}

// Tipos para reporte de facturadores
export interface FacturadorReporte {
  idfacturador: number;
  nombre_fantasia: string;
  titular: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  ruc: string;
  timbrado_nro: string;
  fecha_inicio_vigente: string;
  fecha_fin_vigente: string;
  nro_factura_inicial_habilitada: string;
  nro_factura_final_habilitada: string;
  nro_factura_disponible: string;
  culminado: string;
  created_at: string;
  updated_at: string;
  total_ventas: number;
  monto_total_facturado: string;
  monto_total_facturado_raw?: number;
  ganancia_total: string;
  ganancia_total_raw?: number;
  primera_venta: string;
  ultima_venta: string;
  ventas_pagadas: number;
  ventas_pendientes: number;
  monto_pagado: string;
  monto_pagado_raw?: number;
  monto_pendiente: string;
  monto_pendiente_raw?: number;
  total_facturas_habilitadas: number;
  facturas_utilizadas: number;
  facturas_disponibles: number;
  porcentaje_uso: string;
}

export interface ReporteFacturadores {
  titulo: string;
  total_facturadores: number;
  facturadores_activos: number;
  facturadores_culminados: number;
  total_ventas_general?: number;
  monto_total_facturado?: string;
  ganancia_total?: string;
  facturas_utilizadas_total?: number;
  facturas_disponibles_total?: number;
  ventas_pagadas_total?: number;
  ventas_pendientes_total?: number;
  monto_pagado_total?: string;
  monto_pendiente_total?: string;
  facturadores: FacturadorReporte[];
}

export interface DatosReporteFacturadores {
  empresa: EmpresaReporte;
  reporte: ReporteFacturadores;
}

export interface ReporteFacturadoresResponse {
  message: string;
  reportePDFBase64?: string;
  datosReporte: DatosReporteFacturadores;
}

// Tipos para reporte de compras
export interface CompraReporte {
  idcompra: number;
  nro_factura: string;
  fecha: string;
  proveedor_nombre: string;
  proveedor_ruc: string;
  cajero_nombre: string;
  tipo: string;
  estado: string;
  total: string;
  total_raw?: number;
  descuento: string;
  descuento_raw?: number;
  total_productos: number;
  cantidad_total_productos: number;
  observacion: string;
  created_at: string;
}

export interface ReporteCompras {
  titulo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  total_compras: number;
  compras_contado: number;
  compras_credito: number;
  monto_total_compras?: string;
  monto_total_descuentos?: string;
  cantidad_total_productos?: number;
  compras: CompraReporte[];
}

export interface DatosReporteCompras {
  empresa: EmpresaReporte;
  reporte: ReporteCompras;
}

export interface ReporteComprasResponse {
  message: string;
  reportePDFBase64?: string;
  datosReporte: DatosReporteCompras;
}

// Tipos para reporte de ventas
export interface VentaReporte {
  idventa: number;
  nro_factura: string;
  fecha: string;
  cliente_nombre: string;
  cliente_documento: string;
  cajero_nombre: string;
  tipo: string;
  estado: string;
  estado_pago?: string;
  total: string;
  total_raw?: number;
  descuento_aplicado: string;
  descuento_raw?: number;
  ganancia_total: string;
  ganancia_raw?: number;
  total_productos: number;
  cantidad_total_productos: number;
  created_at: string;
}

export interface ReporteVentas {
  titulo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  total_ventas: number;
  ventas_contado: number;
  ventas_credito: number;
  monto_total_ventas?: string;
  monto_total_descuentos?: string;
  ganancia_total?: string;
  cantidad_total_productos?: number;
  ventas: VentaReporte[];
}

export interface DatosReporteVentas {
  empresa: EmpresaReporte;
  reporte: ReporteVentas;
}

export interface ReporteVentasResponse {
  message: string;
  reportePDFBase64?: string;
  datosReporte: DatosReporteVentas;
}
