import React, { useState } from "react";
import { crearUsuario } from "../../services/usuarios";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import PhoneField from "./PhoneField";

interface RegisterUser {
  login: string;
  password: string;
  acceso: string;
  estado: string;
  nombre: string;
  apellido: string;
  telefono: string;
  cedula: string;
  email: string;
}

const initialValue: RegisterUser = {
  login: "",
  password: "",
  acceso: "",
  estado: "",
  nombre: "",
  apellido: "",
  telefono: "",
  cedula: "",
  email: "",
};

interface RegistrarUser {
  onSuccess?: () => void;
}

const RegisterUser: React.FC<RegistrarUser> = ({ onSuccess }) => {
  const [registerUser, setRegisterUser] = useState<RegisterUser>(initialValue);
  const [loading, setLoading] = useState(false);
  const [creada, setCreada] = useState(false);
  const [error, setError] = useState("");
  const [verClave, setVerClave] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterUser((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = (): boolean => {
    const required = [
      ["login", "nombre de usuario"],
      ["password", "contraseña"],
      ["nombre", "nombre"],
      ["apellido", "apellido"],
      ["cedula", "cédula de identidad"],
      ["email", "correo electrónico"],
      ["telefono", "teléfono"],
    ];
    for (const [key, label] of required) {
      if (!registerUser[key as keyof RegisterUser]?.trim()) {
        setError(`Ingresá ${label}.`);
        return false;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(registerUser.email.trim())) {
      setError("Ingresá un correo electrónico válido.");
      return false;
    }
    if (!/^\d{5,10}$/.test(registerUser.cedula.replace(/\D/g, ""))) {
      setError("La cédula de identidad debe tener entre 5 y 10 números.");
      return false;
    }
    if (registerUser.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    return true;
  };

  const postRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      setRegisterUser((prev) => ({ ...prev, acceso: "Administrador", estado: "activo" }));
      await crearUsuario(registerUser);
      setCreada(true);
      setRegisterUser(initialValue);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Error al crear el usuario. Intente nuevamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const labelStyle = "mb-1.5 block text-sm font-medium text-slate-700";
  const inputStyle = "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15";

  if (creada) {
    return (
      <div className="px-2 py-6 text-center" data-testid="registro-exitoso">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={30} /></span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">¡Cuenta creada!</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-slate-600">
          Para empezar a usar el sistema, el administrador tiene que habilitar tu licencia. Apenas lo haga, ingresá con tu usuario y contraseña.
        </p>
        <button type="button" onClick={() => onSuccess?.()} className="mt-7 h-12 w-full rounded-lg bg-blue-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30">
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 pr-10">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Crear tu cuenta</h2>
        <p className="mt-1 text-[15px] text-slate-600">Completá tus datos. La licencia la habilita el administrador del sistema.</p>
      </div>

      <form onSubmit={postRegister} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-nombre" className={labelStyle}>Nombre</label>
            <input id="r-nombre" type="text" name="nombre" value={registerUser.nombre} onChange={handleChange} placeholder="Juan" autoComplete="given-name" className={inputStyle} />
          </div>
          <div>
            <label htmlFor="r-apellido" className={labelStyle}>Apellido</label>
            <input id="r-apellido" type="text" name="apellido" value={registerUser.apellido} onChange={handleChange} placeholder="Pérez" autoComplete="family-name" className={inputStyle} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-cedula" className={labelStyle}>Cédula de identidad</label>
            <input id="r-cedula" type="text" inputMode="numeric" name="cedula" value={registerUser.cedula} onChange={handleChange} placeholder="1234567" className={inputStyle} />
          </div>
          <div>
            <label htmlFor="r-email" className={labelStyle}>Correo electrónico</label>
            <input id="r-email" type="email" name="email" value={registerUser.email} onChange={handleChange} placeholder="usuario@gmail.com" autoComplete="email" className={inputStyle} />
          </div>
        </div>

        <PhoneField value={registerUser.telefono} onChange={(phone) => { setRegisterUser((prev) => ({ ...prev, telefono: phone || "" })); setError(""); }} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="r-login" className={labelStyle}>Usuario</label>
            <input id="r-login" type="text" name="login" value={registerUser.login} onChange={handleChange} placeholder="Elegí un usuario" autoComplete="username" className={inputStyle} />
          </div>
          <div>
            <label htmlFor="r-password" className={labelStyle}>Contraseña</label>
            <div className="relative">
              <input id="r-password" type={verClave ? "text" : "password"} name="password" value={registerUser.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" autoComplete="new-password" className={`${inputStyle} pr-11`} />
              <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
                {verClave ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
            <AlertCircle size={18} className="mt-px shrink-0 text-red-500" /> <span>{error}</span>
          </div>
        )}

        <button disabled={loading} type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 disabled:cursor-wait disabled:opacity-80">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Creando cuenta…</> : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
};

export default RegisterUser;
