"use client"

import React, { useState, useEffect } from "react";

export default function PeopleViewDisplay({ data }) {
  if (!data?.length) return (
    <section>
      <h1>No data available.</h1>
    </section>
  );

  const itemHoverClass =
    "transition-transform duration-240 ease-in-out hover:-translate-y-2 p-2";

  const [imgLoaded, setImgLoaded] = useState({});
  const [imgError, setImgError] = useState({});

  useEffect(() => {
    const preloadedImages = {};
    data.forEach((item) => {
      const imgSrc = item.image;
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
  }, [data]);

  const handleImgLoad = (id) => {
    setImgLoaded(prev => ({ ...prev, [id]: true }));
    setImgError(prev => ({ ...prev, [id]: false }));
  };

  const handleImgError = (id) => {
    setImgLoaded(prev => ({ ...prev, [id]: true }));
    setImgError(prev => ({ ...prev, [id]: true }));
  };

  return (
    <section className="flex overflow-x-auto gap-x-4 pl-4 ">
      {data.map((item, index) => (
        <a
          key={`${item.Id}-${index}`}
          className={`flex flex-col items-center max-w-[150px] ${itemHoverClass}`}
          title={item.Overview}
        >
          <div className="relative w-full flex justify-center items-center">
            {!imgLoaded[item.Id] && (
              <div className="avatar w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <div className="skeleton w-full h-full rounded-full" />
              </div>
            )}
            {imgLoaded[item.Id] && !imgError[item.Id] && item.image && (
              <div className="avatar w-24 h-24 sm:w-28 sm:h-28">
                <img
                  loading="lazy"
                  src={item.image}
                  alt={item.Name}
                  className="object-cover rounded-full w-full h-full"
                  onLoad={() => handleImgLoad(item.Id)}
                  onError={() => handleImgError(item.Id)}
                  style={{ width: '100%', height: '100%' }}
                  referrerPolicy="unsafe-url"
                />
              </div>
            )}
            {imgLoaded[item.Id] && (imgError[item.Id] || !item.image) && (
              <div className="avatar w-24 h-24 sm:w-28 sm:h-28 bg-gray-240 flex items-center justify-center rounded-full text-xs text-gray-500">No Image</div>
            )}
          </div>
          <div className="mt-4 w-24 sm:w-28 text-center " title={item.Name} style={{ maxWidth: '124px' }}>
            <p className="truncate font-bold">{item.Name}</p>
            <p className="truncate text-xs">{item.Role}</p>
          </div>
        </a>
      ))}
    </section>
  );
}
