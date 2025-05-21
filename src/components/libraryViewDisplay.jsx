"use client"

import React, { useState, useEffect } from "react";
import RequestModal from "./RequestModal";
import { deleteRequest } from "@/lib/api";

export default function LibraryViewDisplay({ data, viewMode, disableClick, onRequestCancelled, cancelMode, ...props }) {
  const [responsiveViewMode, setResponsiveViewMode] = useState(viewMode);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);

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

  useEffect(() => {
    setImgLoaded({});
    setImgError({});
  }, [responsiveViewMode]);

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
      const isComingSoon = viewMode === "posterView_comingSoon";
      const itemId = isComingSoon ? item.id : item.Id || item.id;
      const imgSrc = getImageSource(item, isComingSoon);
      if (imgSrc) {
        const img = new window.Image();
        img.src = imgSrc;
        img.onload = () => {
          setImgLoaded(prev => ({ ...prev, [itemId]: true }));
          setImgError(prev => ({ ...prev, [itemId]: false }));
        };
        img.onerror = () => {
          setImgLoaded(prev => ({ ...prev, [itemId]: true }));
          setImgError(prev => ({ ...prev, [itemId]: true }));
        };
        preloadedImages[itemId] = img;
      } else {
        setImgLoaded(prev => ({ ...prev, [itemId]: true }));
        setImgError(prev => ({ ...prev, [itemId]: true }));
      }
    });
    return () => {
      Object.values(preloadedImages).forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
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

  const getImageSource = (item, isComingSoon = false) => {
    if ((responsiveViewMode === "posterView_comingSoon" || isComingSoon) && item.images?.length > 0) {
      return item.images[0].remoteUrl;
    } else if (responsiveViewMode === "recommendation" || (responsiveViewMode === "poster grid" && viewMode === "recommendation")) {
      return item.ImageTags?.Primary;
    } else if (responsiveViewMode === "poster grid" || responsiveViewMode === "posterView") {
      return item.posterPath;
    } else if (responsiveViewMode === "default_search") {
      return item.thumbPath;
    }
    return item.thumbPath;
  };

  const handleItemClick = (item) => {
    setModalItem(item);
    setModalOpen(true);
  };

  const handleCancelRequest = async (item) => {
    if (!item?.id && !item?.Id) return;
    const movieId = item.id || item.Id;
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        const res = await deleteRequest(movieId);
        if (onRequestCancelled) onRequestCancelled();
        setModalOpen(false);
      } catch (err) {
        alert(err.message || "Failed to cancel request.");
      }
    }
  };

  if (responsiveViewMode === "poster grid") {
    return (
      <>
      <section className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {data.map((item, index) => {
          const isComingSoon = viewMode === "posterView_comingSoon";
          const itemId = isComingSoon ? item.id : item.Id || item.id || index;
          const posterImgSrc = getImageSource(item, isComingSoon);
          const uniqueKey = `${itemId}-${item.Type || ''}-${index}`;
          const isReady = item.status === 'ready' || item.status === undefined;
          if (isReady) {
            return (
              <a
                href={isComingSoon || disableClick ? undefined : `/info?id=${itemId}&type=${item.Type}`}
                key={uniqueKey}
                className={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview || item.overview}
                {...(!disableClick ? {} : { style: { cursor: 'default', pointerEvents: 'none' } })}
              >
                <div className="relative w-full mb-4 aspect-[2/3]">
                  {!imgLoaded[itemId] && (
                    <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
                  )}
                  {imgLoaded[itemId] && !imgError[itemId] && posterImgSrc && (
                    <img
                      loading="lazy"
                      src={posterImgSrc}
                      alt={item.Name || item.title}
                      className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[itemId] && !imgError[itemId] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleImgLoad(itemId)}
                      onError={() => handleImgError(itemId)}
                      referrerPolicy="unsafe-url"
                    />
                  )}
                  {imgLoaded[itemId] && (imgError[itemId] || !posterImgSrc) && (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                  )}
                  {isComingSoon && item.downloadInfo && (
                    <div className="absolute bottom-0 left-0 w-full p-2 bg-black/50">
                      <progress
                        className="progress progress-primary w-full h-2"
                        value={item.downloadInfo.size - item.downloadInfo.sizeleft}
                        max={item.downloadInfo.size}
                      ></progress>
                      <div className="text-xs text-center mt-1 text-white">
                        {Math.round(((item.downloadInfo.size - item.downloadInfo.sizeleft) / item.downloadInfo.size) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
                <section className="flex flex-col text-center items-center w-full">
                  <h2 className="w-full text-lg font-bold truncate">
                    {isComingSoon ? item.title : item.Name}
                  </h2>
                  {(item.ProductionYear || item.year) && (
                    <p className="text-xs opacity-50">{item.ProductionYear || item.year}</p>
                  )}
                </section>
              </a>
            );
          } else {
            return (
              <button
                type="button"
                key={uniqueKey}
                className={`flex flex-col items-center ${itemHoverClass} w-full text-left bg-transparent border-0 p-0`}
                title={item.Overview || item.overview}
                onClick={!disableClick ? () => handleItemClick(item) : undefined}
                style={disableClick ? { cursor: 'default', pointerEvents: 'none' } : {}}
              >
                <div className="relative w-full mb-4 aspect-[2/3]">
                  {!imgLoaded[itemId] && (
                    <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
                  )}
                  {imgLoaded[itemId] && !imgError[itemId] && posterImgSrc && (
                    <img
                      loading="lazy"
                      src={posterImgSrc}
                      alt={item.Name || item.title}
                      className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[itemId] && !imgError[itemId] ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => handleImgLoad(itemId)}
                      onError={() => handleImgError(itemId)}
                      referrerPolicy="unsafe-url"
                    />
                  )}
                  {imgLoaded[itemId] && (imgError[itemId] || !posterImgSrc) && (
                    <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                  )}
                  {isComingSoon && item.downloadInfo && (
                    <div className="absolute bottom-0 left-0 w-full p-2 bg-black/50">
                      <progress
                        className="progress progress-primary w-full h-2"
                        value={item.downloadInfo.size - item.downloadInfo.sizeleft}
                        max={item.downloadInfo.size}
                      ></progress>
                      <div className="text-xs text-center mt-1 text-white">
                        {Math.round(((item.downloadInfo.size - item.downloadInfo.sizeleft) / item.downloadInfo.size) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
                <section className="flex flex-col text-center items-center w-full">
                  <h2 className="w-full text-lg font-bold truncate">
                    {isComingSoon ? item.title : item.Name}
                  </h2>
                  {(item.ProductionYear || item.year) && (
                    <p className="text-xs opacity-50">{item.ProductionYear || item.year}</p>
                  )}
                </section>
              </button>
            );
          }
        })}
      </section>
      {viewMode === "posterView_comingSoon" && cancelMode ? (
        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={modalItem}
          cancelMode={true}
          onCancel={() => handleCancelRequest(modalItem)}
        />
      ) : (
        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={modalItem}
        />
      )}
      </>
    );
  }

  if (responsiveViewMode === "posterView") {
    return (
      <section className="flex overflow-x-auto">
        {data.map((item) => (
          <a
            href={!disableClick ? `/info?id=${item.Id}&type=${item.Type}` : undefined}
            key={item.Id}
            className={`flex flex-col items-center min-w-[220px] max-w-[180px] ${itemHoverClass}`}
            title={item.Overview}
            {...(!disableClick ? {} : { style: { cursor: 'default', pointerEvents: 'none' } })}
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

  if (responsiveViewMode === "posterView_comingSoon") {
    return (
      <>
      <section className="flex overflow-x-auto">
        {data.map((item) => {
          const hasWarning = item.downloadInfo && item.downloadInfo.status === "warning";
          const errorMessage = item.downloadInfo && item.downloadInfo.errorMessage;
          let percent = 0;
          if (item.downloadInfo && item.downloadInfo.size > 0) {
            percent = Math.round(((item.downloadInfo.size - item.downloadInfo.sizeleft) / item.downloadInfo.size) * 100);
            if (isNaN(percent) || !isFinite(percent)) percent = 0;
          }
          return (
            <section
              key={item.id}
              className={`flex flex-col items-center min-w-[220px] max-w-[180px] ${itemHoverClass}`}
              title={item.overview}
              style={!disableClick ? { cursor: 'pointer' } : { cursor: 'default', pointerEvents: 'none' }}
              onClick={!disableClick ? () => handleItemClick(item) : undefined}
            >
              <div className="relative w-full aspect-[2/3]">
                {!imgLoaded[item.id] && (
                  <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg opacity-100 transition-opacity" />
                )}
                {imgLoaded[item.id] && !imgError[item.id] && item.images && (
                  <img
                    loading="lazy"
                    src={item.images[0].remoteUrl}
                    alt={item.title}
                    className={`h-full w-full object-cover rounded-lg aspect-[2/3] transition-opacity duration-200 ${imgLoaded[item.id] && !imgError[item.id] ? 'opacity-100' : 'opacity-0'}${hasWarning ? ' brightness-75' : ''}`}
                    onLoad={() => handleImgLoad(item.id)}
                    onError={() => handleImgError(item.id)}
                    referrerPolicy="unsafe-url"
                  />
                )}
                {imgLoaded[item.id] && (imgError[item.id] || !item.images) && (
                  <div className="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                )}
                {item.downloadInfo && (
                  <div className="absolute bottom-0 left-0 w-full p-2 bg-black/50">
                    <progress 
                      className="progress progress-primary progress-bar progress-bar-striped w-full h-2" 
                      value={item.downloadInfo.size - item.downloadInfo.sizeleft} 
                      max={item.downloadInfo.size}
                    ></progress>
                    <div className="text-xs text-center mt-1 text-white">
                      {percent}%
                    </div>
                  </div>
                )}
                {hasWarning && (
                  <div className="absolute inset-0 flex items-center justify-center group">
                    <div className="text-yellow-400 text-6xl drop-shadow-lg cursor-pointer" title={errorMessage}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M2.25 19.5l9.02-15.164a1.5 1.5 0 012.46 0l9.02 15.163A1.5 1.5 0 0121.02 21H2.98a1.5 1.5 0 01-1.27-2.25z" />
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full bg-black/80 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </section>
      {cancelMode && (
        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={modalItem}
          cancelMode={true}
          onCancel={() => handleCancelRequest(modalItem)}
        />
      )}
      </>
    );
  }

  if (responsiveViewMode === "recommendation") {
    return (
      <section className="flex overflow-x-auto py-4">
        {data.map((item) => (
          <a
            href={!disableClick ? `/info?id=${item.Id}&type=${item.Type}` : undefined}
            key={item.Id}
            className={`flex flex-col items-center min-w-[150px] max-w-[100px] ${itemHoverClass} gap-2`}
            title={item.Overview}
            {...(!disableClick ? {} : { style: { cursor: 'default', pointerEvents: 'none' } })}
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

  if (responsiveViewMode === "default_search") {
    return (
      <>
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {data.map((item, index) => {
            // Create a unique key using index as fallback if id is undefined
            const uniqueKey = `${item.id || item.Id || index}-${item.status || 'default'}-${index}`;
            if (item.status === 'ready') {
              return (
                <a
                  href={!disableClick ? `/info?id=${item.id}&type=${item.Type}` : undefined}
                  key={uniqueKey}
                  className={`flex flex-col items-center ${itemHoverClass}`}
                  title={item.Overview}
                  {...(!disableClick ? {} : { style: { cursor: 'default', pointerEvents: 'none' } })}
                >
                  <div className="relative w-full mb-2 aspect-[2/1]">
                    {!imgLoaded[item.id] && (
                      <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg" />
                    )}
                    {imgLoaded[item.id] && !imgError[item.id] && item.thumbPath && (
                      <img
                        loading="lazy"
                        src={item.thumbPath}
                        alt={item.Name}
                        className={`w-full aspect-[2/1] object-cover rounded-lg transition-opacity duration-200 ${
                          imgLoaded[item.id] && !imgError[item.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImgLoad(item.id)}
                        onError={() => handleImgError(item.id)}
                        referrerPolicy="unsafe-url"
                      />
                    )}
                    {imgLoaded[item.id] && (imgError[item.id] || !item.thumbPath) && (
                      <div className="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500 absolute inset-0">
                        No Image
                      </div>
                    )}
                  </div>
                  <section className="flex flex-col text-center items-center w-full">
                    <h2 className="w-full text-lg font-bold truncate">
                      {item.OriginalTitle || item.Name}
                    </h2>
                    {item.ProductionYear && <p className="text-xs opacity-50">{item.ProductionYear}</p>}
                  </section>
                </a>
              );
            } else {
              return (
                <button
                  type="button"
                  key={uniqueKey}
                  className={`flex flex-col items-center ${itemHoverClass} w-full text-left bg-transparent border-0 p-0`}
                  title={item.Overview}
                  onClick={!disableClick ? () => handleItemClick(item) : undefined}
                  style={disableClick ? { cursor: 'default', pointerEvents: 'none' } : {}}
                >
                  <div className="relative w-full mb-2 aspect-[2/1]">
                    {!imgLoaded[item.id] && (
                      <div className="skeleton absolute top-0 left-0 w-full h-full rounded-lg" />
                    )}
                    {imgLoaded[item.id] && !imgError[item.id] && item.thumbPath && (
                      <img
                        loading="lazy"
                        src={item.thumbPath}
                        alt={item.Name}
                        className={`w-full aspect-[2/1] object-cover rounded-lg transition-opacity duration-200 ${
                          imgLoaded[item.id] && !imgError[item.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => handleImgLoad(item.id)}
                        onError={() => handleImgError(item.id)}
                        referrerPolicy="unsafe-url"
                      />
                    )}
                    {imgLoaded[item.id] && (imgError[item.id] || !item.thumbPath) && (
                      <div className="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500 absolute inset-0">
                        No Image
                      </div>
                    )}
                  </div>
                  <section className="flex flex-col text-center items-center w-full">
                    <h2 className="w-full text-lg font-bold truncate">
                      {item.OriginalTitle || item.Name}
                    </h2>
                    {item.ProductionYear && item.ProductionYear != 0 ? (
                      <p className="text-xs opacity-50">{item.ProductionYear}</p>
                    ) : (
                      <p  className="text-xs opacity-50">No Year</p>
                    )}
                  </section>
                </button>
              );
            }
          })}
        </section>
        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          item={modalItem}
        />
      </>
    );
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
      {data.map((item) => (
        <a
          href={!disableClick ? `/info?id=${item.Id}&type=${item.Type}` : undefined}
          key={item.Id}
          className={`flex flex-col items-center ${itemHoverClass}`}
          title={item.Overview}
          {...(!disableClick ? {} : { style: { cursor: 'default', pointerEvents: 'none' } })}
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
