"use client"

import React, { useState, useEffect } from "react";

export default function LibraryViewDisplay({ data, viewMode }) {
  const [responsiveViewMode, setResponsiveViewMode] = useState(viewMode);
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 540) {
        setResponsiveViewMode("poster grid");
      } else {
        setResponsiveViewMode(viewMode);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [viewMode]);

  if (!data?.length) return (
    <section>
      <h1>No data available.</h1>
    </section>
  );

  const itemHoverClass =
    "transition-transform duration-200 ease-in-out hover:-translate-y-2 hover:shadow-lg p-2";

  const [imgLoaded, setImgLoaded] = useState({});
  
  useEffect(() => {
    const preloadedImages = {};
    data.forEach((item) => {
      const img = new Image();
      img.src = viewMode === "poster grid" || viewMode === "posterView" ? item.posterPath : item.thumbPath;
      img.onload = () => {
        setImgLoaded(prev => ({ ...prev, [item.Id]: true }));
      };
      preloadedImages[item.Id] = img;
    });

    return () => {
      Object.values(preloadedImages).forEach(img => {
        img.onload = null;
      });
      setImgLoaded({});
    };
  }, [data, viewMode]);

  const handleImgLoad = (id) => {
    setImgLoaded(prev => ({ ...prev, [id]: true }));
  };

  if (responsiveViewMode === "poster grid") {
    return (
      <section className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {data.map((item) => (
          <a
            href={`/info?id=${item.Id}&type=${item.Type}`}
            key={item.Id}
            className={`flex flex-col items-center ${itemHoverClass}`}
            title={item.Overview}
          >
            <div className="relative w-full mb-4 aspect-[2/3]">
              {!imgLoaded[item.Id] && (
                <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
              )}
              <img
                loading="lazy"
                src={item.posterPath}
                alt={item.Name}
                className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${!imgLoaded[item.Id] ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => handleImgLoad(item.Id)}
              />
            </div>
            <section className="flex flex-col text-center items-center w-full">
            <h2 className="w-full text-lg font-bold truncate">
              {item.Name}
            </h2>
            {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
          </section>
          </a>
        ))}
      </section>
    );
  }

  if (responsiveViewMode === "posterView") {
    return (
      <section className="flex overflow-x-auto gap-6 pb-4">
        {data.map((item) => (
          <a
            href={`/info?id=${item.Id}&type=${item.Type}`}
            key={item.Id}
            className={`flex flex-col items-center min-w-[200px] max-w-[180px] ${itemHoverClass}`}
            title={item.Overview}
          >
            <div className="relative w-full mb-4 aspect-[2/3]">
              {!imgLoaded[item.Id] && (
                <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
              )}
              <img
                loading="lazy"
                src={item.posterPath}
                alt={item.Name}
                className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${!imgLoaded[item.Id] ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => handleImgLoad(item.Id)}
              />
            </div>
            <section className="flex flex-col text-center items-center w-full">
            <h2 className="w-full text-lg font-bold truncate">
              {item.Name}
            </h2>
            {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
          </section>
          </a>
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {data.map((item) => (
        <a
          href={`/info?id=${item.Id}&type=${item.Type}`}
          key={item.Id}
          className={`flex flex-col items-center ${itemHoverClass}`}
          title={item.Overview}
        >
          <div className="relative w-full mb-2">
            {!imgLoaded[item.Id] && (
              <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
            )}
            <img
              loading="lazy"
              src={item.thumbPath}
              alt={item.Name}
              className={`w-full aspect-[2/1] object-cover rounded-lg transition-opacity duration-200 ${!imgLoaded[item.Id] ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => handleImgLoad(item.Id)}
            />
          </div>
          <section className="flex flex-col text-center items-center w-full">
            <h2 className="w-full text-lg font-bold truncate">
              {item.Name}
            </h2>
            {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
          </section>
        </a>
      ))}
    </section>
  );
}
