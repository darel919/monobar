"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function HeroView({ items }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const total = items.length;
  console.log("HeroView items: ", items);

  useEffect(() => {
    if (total < 2) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 15000);
    return () => clearInterval(interval);
  }, [total]);

  useEffect(() => {
    setFade(false);
    const timeout = setTimeout(() => setFade(true), 100);
    return () => clearTimeout(timeout);
  }, [current]);

  if (!items) return null;

  const item = items[current];

  return (
    <Link
      href={`/info?id=${item.Id}&type=${item.Type || ''}`}
      className="block"
      tabIndex={-1}
      style={{ textDecoration: 'none' }}
    >
      <section
        className={`hero min-h-[400px] bg-base-200 mb-8 rounded-xl overflow-hidden relative cursor-pointer group transition-all duration-700 ${fade ? 'opacity-100' : 'opacity-0'}`}
        style={item.thumbPath ? {
          backgroundImage: `url(${item.thumbPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        } : {}}
      >
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-black/80" />
        </div>
        <div className="hero-content flex-col lg:flex-row-reverse w-full relative z-10 p-8">
          <div className="flex-1">
            <section className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
                {item.CommunityRating !== undefined && (
                    <span>{item.CommunityRating.toFixed(1)}</span>
                )}
            </section>
            <h1 className="sm:text-5xl text-3xl font-bold sm:mb-6 mb-2 text-white drop-shadow-lg">{item.OriginalTitle || item.Name}</h1>
            {item.Overview && (
              <p className="sm:text-lg text-md text-white drop-shadow-lg break-words whitespace-normal overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical'}}>
                {item.Overview}
              </p>
            )}
          </div>
        </div>
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {items.map((_, idx) => (
              <button
                key={idx}
                className={`btn btn-xs btn-circle ${idx === current ? "btn-primary" : "btn-ghost"}`}
                onClick={e => { e.preventDefault(); setCurrent(idx); }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>
    </Link>
  );
}
