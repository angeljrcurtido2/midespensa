'use client';

import { useEffect, useState } from 'react';
import ModalsListarActividadesEconomicas from './ModalsActivEcon/ModalsListarActividadesEconomicas';
import { getFacturadorById, updateFacturador } from '../../services/facturador';
import ModalError from '../../components/ModalError';
import ModalSuccess from '../../components/ModalSuccess';
import { FaListAlt, FaPlus, FaTimes } from 'react-icons/fa';
import LogoFacturador from '../../components/LogoFacturador';

interface EditarFacturadorProps {
    id: number | string;
    onSuccess?: () => void;
    onClose?: () => void;
}

const initialFormFacturador = {
    nombre_fantasia: '',
    titular: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    ruc: '',
    timbrado_nro: '',
    fecha_inicio_vigente: '',
    fecha_fin_vigente: '',
    nro_factura_inicial_habilitada: '',
    nro_factura_final_habilitada: '',
};

// El RUC, el timbrado y la numeración pueden quedar vacíos (negocios que solo emiten tickets).
const REQUERIDOS = ['nombre_fantasia', 'titular', 'fecha_inicio_vigente', 'fecha_fin_vigente'];

const styleButton = "mt-8 mb-8 bg-blue-600 text-white font-semibold py-2 rounded-full hover:bg-blue-700 transition";

const EditarFacturador = ({ id, onSuccess, onClose }: EditarFacturadorProps) => {
    const [formData, setFormData] = useState(initialFormFacturador);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedActividades, setSelectedActividades] = useState<any[]>([]);
    const [modalListarActividadesOpen, setModalListarActividadesOpen] = useState(false);

    useEffect(() => {
        if (id) {
            getFacturadorById(id)
                .then((res) => {
                    const data = res.data.data;
                    setFormData({
                        ...data,
                        fecha_inicio_vigente: data.fecha_inicio_vigente?.split('T')[0] || '',
                        fecha_fin_vigente: data.fecha_fin_vigente?.split('T')[0] || '',
                    });
                    setSelectedActividades(data.actividades_economicas || []);
                })
                .catch((error) => {
                    console.error('  Error al cargar datos del facturador', error);
                });
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                actividades_economicas: selectedActividades.map((a) => a.idactividad)
            };

            await updateFacturador(id, payload);
            setSuccessModalOpen(true);
            onSuccess && onSuccess();
        } catch (error: any) {
            console.error(error);
            setErrorMessage('  ' + (error.response?.data?.error || 'Error desconocido'));
            setErrorModalOpen(true);
        }
    };

    const handleSuccessClose = () => {
        setSuccessModalOpen(false);
        onClose && onClose();
    };

    const renderInput = (name: string, placeholder: string, type = 'text', label?: string) => (
        <div className="flex flex-col">
            {label && (
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}{REQUERIDOS.includes(name) && <span className="text-rose-500"> *</span>}</label>
            )}
            <input
                type={type}
                name={name}
                placeholder={REQUERIDOS.includes(name) && type === 'text' ? `${placeholder} *` : placeholder}
                required={REQUERIDOS.includes(name)}
                value={formData[name as keyof typeof formData]}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
        </div>
    );

    return (
        <div className="flex items-center justify-center px-4 border border-blue-300 dark:border-gray-600 rounded-lg shadow-lg">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full">
                <h2 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-8">
                    Editar Facturador
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {renderInput('nombre_fantasia', 'Nombre Fantasía')}
                    {renderInput('titular', 'Titular')}
                    {renderInput('telefono', 'Teléfono')}
                    {renderInput('direccion', 'Dirección')}
                    {renderInput('ciudad', 'Ciudad')}
                    {renderInput('ruc', 'RUC')}
                    {renderInput('timbrado_nro', 'N° Timbrado')}
                    {renderInput('fecha_inicio_vigente', 'Fecha Inicio Vigente', 'date', 'Fecha Inicio Vigente')}
                    {renderInput('fecha_fin_vigente', 'Fecha Fin Vigente', 'date', 'Fecha Fin Vigente')}
                    {renderInput('nro_factura_inicial_habilitada', 'Nro Factura Inicial')}
                    {renderInput('nro_factura_final_habilitada', 'Nro Factura Final')}

                    {/* Actividades económicas */}
                    <div className="md:col-span-2 flex flex-col items-start gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actividades Económicas</label>

                        <button
                            type="button"
                            onClick={() => setModalListarActividadesOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-medium"
                        >
                            <FaPlus />
                            Seleccionar Actividades
                        </button>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedActividades.map((act) => (
                                <span key={act.idactividad} className="flex items-center gap-2 bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-blue-300 text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-gray-600 font-medium">
                                    <FaListAlt className="text-blue-600 dark:text-blue-400" />
                                    {act.descripcion}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedActividades(selectedActividades.filter(a => a.idactividad !== act.idactividad))}
                                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-gray-600 rounded-full p-0.5 transition-colors"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <LogoFacturador idfacturador={id} />

                    <button
                        type="submit"
                        className={styleButton}
                    >
                        Guardar Cambios
                    </button>

                </form>
            </div>

            {/* Modales */}
            <ModalSuccess
                isOpen={successModalOpen}
                onClose={handleSuccessClose}
                message="Facturador actualizado con éxito"
            />
            <ModalError
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                message={errorMessage}
            />
            <ModalsListarActividadesEconomicas
                isOpen={modalListarActividadesOpen}
                onClose={() => setModalListarActividadesOpen(false)}
                onSelect={(activities) => setSelectedActividades(activities)}
            />
        </div>
    );
};

export default EditarFacturador;
