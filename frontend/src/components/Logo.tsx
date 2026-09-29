import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
}

const Logo: React.FC<LogoProps> = ({ to = '/' }) => {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 md:gap-3 cursor-pointer group min-w-0"
    >
      <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform flex-shrink-0">
        💛
      </span>
      <div className="min-w-0">
        <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-serif font-bold text-[#3D405B] group-hover:text-[#E07A5F] transition-colors leading-tight">
          Voces del Alma
        </h1>
        <p className="text-[10px] sm:text-xs md:text-sm text-[#5D6078] leading-tight">
           &nbsp; Hablar para Sanar
        </p>
      </div>
    </Link>
  );
};

export default Logo;