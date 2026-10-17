export interface DetalleVenta {
    idproducto: number;
    producto: string;
    cantidad: string;
    precio_venta: string;
    sub_total: string;
}

export interface ComprobantePago {
    cliente: string;
    fecha_pago: string;
    monto_pagado: string;
    saldo: string;
    detallesVenta: DetalleVenta[];
}

export interface CobroDeudaProps {
    iddeuda: number;
    onClose?: () => void;
    onSuccess?: () => void;
    montoMaximo?: number;
    setComprobante?: (data: ComprobantePago) => void;
    setShowComprobante?: (value: boolean) => void;
}