import React from "react";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import clsx from "clsx";

const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
  <input
    {...props}
    ref={ref}
    className="flex-1 bg-transparent py-3 pr-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
    placeholder="+595 981 123 456"
  />
));

interface Props {
  value?: string; // puede ser undefined también
  onChange: (value: string | undefined) => void;
}

const PhoneField: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="mb-1.5 text-sm font-medium text-slate-700">Teléfono</label>
      <PhoneInput
        international
        defaultCountry="PY"
        value={value}
        onChange={onChange}
        inputComponent={CustomInput}
        className={clsx(
          "flex w-full rounded-lg border border-slate-300 bg-white pl-3 transition",
          "focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15"
        )}
      />
    </div>
  );
};

export default PhoneField;
