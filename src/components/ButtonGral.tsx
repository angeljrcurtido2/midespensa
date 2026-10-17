import { type ReactNode } from "react";

interface ButtonGralProps {
  text: string;
  onClick?: () => void;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

const ButtonGral = ({
  text,
  onClick,
  icon,
  type = "button",
  disabled = false,
}: ButtonGralProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="truncate text-sm px-2 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold "
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{text}</span>
    </button>
  );
};

export default ButtonGral;
