import React from 'react';

interface CardProps {
  title: string;
  size?: 'full' | '50' | '33' | '25';
  children: React.ReactNode;
}

function Card({ title, size = '50', children }: CardProps) {
  const sizeClass = {
    full: 'sm:w-full',
    '50': 'sm:w-1/2',
    '33': 'sm:w-1/3',
    '25': 'sm:w-1/4',
  }[size];
  return (
    <div
      className={`relative flex flex-col gap-2 rounded border border-red-600 bg-zinc-50 p-4 pt-6 text-base text-zinc-800 shadow-md ${sizeClass}`}
    >
      <span className="absolute -top-3 left-0.5 rounded bg-zinc-50 px-1 text-base text-red-600">
        {title}
      </span>
      <div className="flex flex-col justify-around gap-2 sm:h-auto">
        {children}
      </div>
    </div>
  );
}

export default Card;
