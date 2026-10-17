// utils/formClienteSelects.ts

export const selectFieldsConfig = [
  {
    name: 'tipo',
    placeholder: 'Seleccione tipo de persona',
    options: [
      { value: 'FISICA', label: 'Física' },
      { value: 'JURIDICA', label: 'Jurídica' }
    ]
  },
  {
    name: 'genero',
    placeholder: 'Seleccione género',
    options: [
      { value: 'M', label: 'Masculino' },
      { value: 'F', label: 'Femenino' }
    ]
  },
  {
    name: 'tipo_cliente',
    placeholder: 'Seleccione tipo de cliente',
    options: [
      { value: 'MAYORISTA', label: 'Mayorista' },
      { value: 'MINORISTA', label: 'Minorista' }
    ]
  },
  {
    name: 'tipo_documento',
    placeholder: 'Seleccione tipo de documento',
    options: [
      { value: 'CI', label: 'Cédula de identidad' },
      { value: 'RUC', label: 'Registro Unico de Contr.' }
    ]
  }

];




export const initialFormCliente = {
  nombre: '',
  apellido: '',
  tipo: 'FISICA',
  numDocumento: '',
  telefono: '',
  direccion: '',
  genero: 'M',
  estado: 'activo',
  descripcion: '',
  tipo_cliente: 'MINORISTA',
};

export const renderInput = (
  name: string,
  placeholder: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => (
  <input
    type="text"
    required
    name={name}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
  />
);

interface TitleWithIconProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode; 
}

export const renderTitle = ({ title, subtitle, icon }: TitleWithIconProps) => (
  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6 text-white">
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 md:gap-5">
      <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 md:p-5 rounded-2xl shrink-0">
        {icon}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-1">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-blue-100">{subtitle}</p>
      </div>
    </div>
  </div>
);

