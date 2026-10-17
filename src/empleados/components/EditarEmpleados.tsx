'use client';

import { useEffect, useState } from 'react';
import ModalSuccess from '../../components/ModalSuccess';
import ModalError from '../../components/ModalError';
import { getEmpleadosId, updateEmpleado } from '../../services/rrhh';

interface EditarEmpleadoProps {
  id: number | string;
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialForm = {
  nombre: '',
  apellido: '',
  cedula: '',
  telefono: '',
  direccion: '',
  fecha_nacimiento: '',
  fecha_ingreso: '',
  tipo_remuneracion: 'Fijo',
  aporta_ips: true,
  porcentaje_ips_empleado: 9,
  porcentaje_ips_empleador: 16.5,
  estado: 'activo' as 'activo' | 'inactivo',
};

const EditarEmpleados = ({ id, onSuccess, onClose }: EditarEmpleadoProps) => {
  const [formData, setFormData] = useState(initialForm);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    getEmpleadosId(id as string)
      .then((res: any) => {
        const raw = (res.data as any)?.data ?? res.data;

        setFormData({
          nombre: raw?.nombre || '',
          apellido: raw?.apellido || '',
          cedula: raw?.cedula || '',
          telefono: raw?.telefono || '',
          direccion: raw?.direccion || '',
          fecha_nacimiento: raw?.fecha_nacimiento ? String(raw.fecha_nacimiento).slice(0, 10) : '',
          fecha_ingreso: raw?.fecha_ingreso ? String(raw.fecha_ingreso).slice(0, 10) : '',
          // Los empleados existentes tienen el campo vacío por el bug anterior;
          // 'Fijo' es el caso más común y queda editable.
          tipo_remuneracion: raw?.tipo_remuneracion || 'Fijo',
          aporta_ips: Boolean(raw?.aporta_ips),
          porcentaje_ips_empleado: Number(raw?.porcentaje_ips_empleado ?? 9),
          porcentaje_ips_empleador: Number(raw?.porcentaje_ips_empleador ?? 16.5),
          estado: (raw?.estado || 'activo') as 'activo' | 'inactivo',
        });
      })
      .catch((error: any) => {
        console.error('Error al obtener empleado:', error);
        setErrorMessage('  No se pudo cargar el empleado');
        setErrorModalOpen(true);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === 'aporta_ips') {
      setFormData((prev) => ({ ...prev, aporta_ips: value === 'true' }));
      return;
    }

    if (name === 'porcentaje_ips_empleado' || name === 'porcentaje_ips_empleador') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        cedula: formData.cedula || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
      };

      await updateEmpleado(id, payload);
      setSuccessModalOpen(true);
      onSuccess && onSuccess();
    } catch (error: any) {
      console.error('Error al actualizar empleado:', error);
      setErrorMessage('  ' + (error?.response?.data?.error || 'Error al actualizar empleado'));
      setErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    onClose && onClose();
  };

  return (
    <div className="flex items-center justify-center px-4 border border-blue-300 dark:border-gray-600 rounded-lg shadow-lg">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full">
        <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
          Editar Empleado
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido" required className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input name="cedula" value={formData.cedula} onChange={handleChange} placeholder="Cï¿½dula" className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Telï¿½fono" className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Direcciï¿½n" className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />
          <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} onChange={handleChange} required className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2" />

          {/* Valores del enum de la tabla; ver nota en CrearEmpleados. */}
          <select name="tipo_remuneracion" value={formData.tipo_remuneracion} onChange={handleChange} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2">
            <option value="Fijo">Remuneración fija</option>
            <option value="Comision">Sólo comisión</option>
            <option value="Mixto">Mixta (fijo + comisión)</option>
          </select>

          <select name="aporta_ips" value={String(formData.aporta_ips)} onChange={handleChange} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2">
            <option value="true">Aporta IPS: Sí</option>
            <option value="false">Aporta IPS: No</option>
          </select>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="porcentaje_ips_empleado">
              Porcentaje Empleado
            </label>
            <input
              id="porcentaje_ips_empleado"
              type="number"
              step="0.01"
              name="porcentaje_ips_empleado"
              value={formData.porcentaje_ips_empleado}
              onChange={handleChange}
              placeholder="% IPS Empleado"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="porcentaje_ips_empleador">
              Porcentaje Empleador
            </label>
            <input
              id="porcentaje_ips_empleador"
              type="number"
              step="0.01"
              name="porcentaje_ips_empleador"
              value={formData.porcentaje_ips_empleador}
              onChange={handleChange}
              placeholder="% IPS Empleador"
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 w-full"
            />
          </div>
          <select name="estado" value={formData.estado} onChange={handleChange} className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2">
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>

          <div className="md:col-span-2 flex gap-3 mt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      <ModalSuccess
        isOpen={successModalOpen}
        onClose={handleSuccessClose}
        message="Empleado actualizado con exito"
      />
      <ModalError
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        message={errorMessage}
      />
    </div>
  );
};

export default EditarEmpleados;

