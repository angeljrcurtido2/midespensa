import React from "react";

interface SecondaryButtonProps {
  texto: string;
  onClick?: (e: any) => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset"; 
  isLoading?: boolean;
  decoration?: boolean;
  decorationImg?: string;
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  texto,
  type = "button",
  onClick,
  className = "",
  disabled = false,
  isLoading = false,
  decoration = false,
  decorationImg = '/img/download-white.svg'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`bg-white p-2.5 rounded-full text-[#ED1A3B] border-[#ED1A3B] border w-full max-w-xs hover:scale-105 transition ${className}`}
      disabled={disabled}
    >
      {texto}
      {isLoading && (
        <div className="absolute w-5 h-5 border-r-2 border-t-2 border-[#ED1A3B] rounded-full animate-spin right-2 top-3"></div>
      )}
      {decoration && (
        <div className='flex justify-center items-center bg-[#ED1A3B] rounded-full w-8 h-8'>
          <img src={decorationImg} alt='download-white' width={10} height={10} />
        </div>
      )}
    </button>
  );
};

export default SecondaryButton;
