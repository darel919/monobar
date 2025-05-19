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
    "transition-transform duration-200 ease-in-out hover:-translate-y-2 p-2";

  const [imgLoaded, setImgLoaded] = useState({});
  const [imgError, setImgError] = useState({});

  useEffect(() => {
    const preloadedImages = {};
    data.forEach((item) => {
      let imgSrc;
      if (responsiveViewMode === "recommendation") {
        imgSrc = item.ImageTags?.Primary;
      } else if (responsiveViewMode === "poster grid" && viewMode === "recommendation") {
        imgSrc = item.ImageTags?.Primary;
      } else if (responsiveViewMode === "poster grid" || responsiveViewMode === "posterView") {
        imgSrc = item.posterPath;
      } else {
        imgSrc = item.thumbPath;
      }
      if (imgSrc) {
        const img = new window.Image();
        img.src = imgSrc;
        img.onload = () => {
          setImgLoaded(prev => ({ ...prev, [item.Id]: true }));
          setImgError(prev => ({ ...prev, [item.Id]: false }));
        };
        img.onerror = () => {
          setImgLoaded(prev => ({ ...prev, [item.Id]: true }));
          setImgError(prev => ({ ...prev, [item.Id]: true }));
        };
        preloadedImages[item.Id] = img;
      } else {
        setImgLoaded(prev => ({ ...prev, [item.Id]: true }));
        setImgError(prev => ({ ...prev, [item.Id]: true }));
      }
    });

    return () => {
      Object.values(preloadedImages).forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
      setImgLoaded({});
      setImgError({});
    };
  }, [data, responsiveViewMode, viewMode]);

  const handleImgLoad = (id) => {
    setImgLoaded(prev => ({ ...prev, [id]: true }));
    setImgError(prev => ({ ...prev, [id]: false }));
  };

  const handleImgError = (id) => {
    setImgLoaded(prev => ({ ...prev, [id]: true }));
    setImgError(prev => ({ ...prev, [id]: true }));
  };

  if (responsiveViewMode === "poster grid") {
    return (
      <section className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {data.map((item) => {
          const posterImgSrc = viewMode === "recommendation" && responsiveViewMode === "poster grid"
            ? item.ImageTags?.Primary
            : item.posterPath;
          return (
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
                {imgLoaded[item.Id] && !imgError[item.Id] && posterImgSrc && (
                  <img
                    loading="lazy"
                    src={posterImgSrc}
                    alt={item.Name}
                    className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[item.Id] && !imgError[item.Id] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => handleImgLoad(item.Id)}
                    onError={() => handleImgError(item.Id)}
                    referrerPolicy="unsafe-url"
                  />
                )}
                {imgLoaded[item.Id] && (imgError[item.Id] || !posterImgSrc) && (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                )}
              </div>
              <section className="flex flex-col text-center items-center w-full">
                <h2 className="w-full text-lg font-bold truncate">
                  {item.Name}
                </h2>
                {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
              </section>
            </a>
          );
        })}
      </section>
    );
  }

  if (responsiveViewMode === "posterView") {
    return (
      <section className="flex overflow-x-auto">
        {data.map((item) => (
          <a
            href={`/info?id=${item.Id}&type=${item.Type}`}
            key={item.Id}
            className={`flex flex-col items-center min-w-[220px] max-w-[180px] ${itemHoverClass}`}
            title={item.Overview}
          >
            <div className="relative w-full aspect-[2/3]">
              {!imgLoaded[item.Id] && (
                <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
              )}
              {imgLoaded[item.Id] && !imgError[item.Id] && item.posterPath && (
                <img
                  loading="lazy"
                  src={item.posterPath}
                  alt={item.Name}
                  className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[item.Id] && !imgError[item.Id] ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImgLoad(item.Id)}
                  onError={() => handleImgError(item.Id)}
                  referrerPolicy="unsafe-url"
                />
              )}
              {imgLoaded[item.Id] && (imgError[item.Id] || !item.posterPath) && (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
              )}
            </div>
          </a>
        ))}
      </section>
    );
  }

  if (responsiveViewMode === "recommendation") {
    return (
      <section className="flex overflow-x-auto py-4">
        {data.map((item) => (
          <a
            href={`/info?id=${item.Id}&type=${item.Type}`}
            key={item.Id}
            className={`flex flex-col items-center min-w-[150px] max-w-[100px] ${itemHoverClass} gap-2`}
            title={item.Overview}
          >
            <div className="relative w-full aspect-[2/3]">
              {!imgLoaded[item.Id] && (
                <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
              )}
              {imgLoaded[item.Id] && !imgError[item.Id] && item.ImageTags?.Primary && (
                <img
                  loading="lazy"
                  src={item.ImageTags.Primary}
                  alt={item.Name}
                  className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[item.Id] && !imgError[item.Id] ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => handleImgLoad(item.Id)}
                  onError={() => handleImgError(item.Id)}
                  referrerPolicy="unsafe-url"
                />
              )}
              {imgLoaded[item.Id] && (imgError[item.Id] || !item.ImageTags?.Primary) && (
                <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
              )}
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
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {data.map((item) => (
        <a
          href={`/info?id=${item.Id}&type=${item.Type}`}
          key={item.Id}
          className={`flex flex-col items-center ${itemHoverClass}`}
          title={item.Overview}
        >
          <div className="relative w-full mb-2 aspect-[2/1]">
            {!imgLoaded[item.Id] && (
              <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
            )}
            {imgLoaded[item.Id] && !imgError[item.Id] && item.thumbPath && (
              <img
                loading="lazy"
                src={item.thumbPath}
                alt={item.Name}
                className={`w-full aspect-[2/1] object-cover rounded-lg transition-opacity duration-200 ${imgLoaded[item.Id] && !imgError[item.Id] ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => handleImgLoad(item.Id)}
                onError={() => handleImgError(item.Id)}
                referrerPolicy="unsafe-url"
              />
            )}
            {imgLoaded[item.Id] && (imgError[item.Id] || !item.thumbPath) && (
              <div className="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
            )}
          </div>
          <section className="flex flex-col text-center items-center w-full">
            {item.OriginalTitle ? <h2 className="w-full text-lg font-bold truncate">
              {item.OriginalTitle}
            </h2> : <h2 className="w-full text-lg font-bold truncate">
              {item.Name}
            </h2>}
            {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
          </section>
        </a>
      ))}
    </section>
  );
}
