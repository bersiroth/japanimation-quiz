import React from "react";

function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {

  return (
    <div className="relative flex flex-col gap-2 rounded border border-red-600 bg-zinc-50 p-4 pt-6 text-base text-zinc-800 shadow-md sm:w-1/2">
      <span className="absolute -top-3 left-0.5 rounded bg-zinc-50 px-1 text-base text-red-600">
        {title}
      </span>
      {children}
    </div>
  );
}

export default Card;
