import React from "react";

interface PrimaryButtonProps {
  type?: "button" | "submit" | "reset";
  texto?: string;
  children?: React.ReactNode; 
  onClick: (e: any) => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  type = "button",
  texto,
  children,
  onClick,
  className = "",
  disabled = false,
  isLoading = false,
}) => {
  return (
    <button
      type= {type}
      onClick={onClick}
      className={`bg-[#ED1A3B] w-full max-w-xs p-2.5 relative rounded-full text-white hover:scale-105 transition ${className}`}
      disabled={disabled}
    >
      {children ?? texto}
      {isLoading && (
        <div className="absolute w-5 h-5 border-r-2 border-t-2 border-white rounded-full animate-spin right-2 top-3"></div>
      )}
    </button>
  );
};

export default PrimaryButton;
