import React from 'react';

interface AvatarProps {
  nombre: string;
  foto?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ nombre, foto, size = 'md' }) => {
  // Obtener iniciales (primeras letras de cada palabra, máximo 2)
  const iniciales = nombre
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (foto) {
    return (
      <img
        src={foto}
        alt={nombre}
        className={`${sizes[size]} rounded-full object-cover`}
      />
    );
  }

  // Colores basados en el nombre (siempre el mismo color para el mismo nombre)
  const colores = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const colorIndex = nombre.length % colores.length;
  const colorFondo = colores[colorIndex];

  return (
    <div className={`${sizes[size]} ${colorFondo} rounded-full flex items-center justify-center text-white font-bold`}>
      {iniciales}
    </div>
  );
};

export default Avatar;
