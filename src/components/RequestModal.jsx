import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRequest, deleteRequest } from "../lib/api";

export default function RequestModal({ open, onClose, item, cancelMode }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buttonState, setButtonState] = useState("idle"); 
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
    const handleClose = () => {
      if (onClose) onClose();
      setShowConfirm(false);
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [open, onClose]);

  if (!item) return null;

  const posterUrl = item.posterPath;
  const backdropUrl = item.backdropPath;

  const handleRequest = async () => {
    setLoading(true);
    setButtonState("loading");
    setError("");
    try {
      await createRequest(item.id, item.Type || item.mediaType);
      setLoading(false);
      setButtonState("idle");
      if (onClose) onClose();
      router.push("/request");
    } catch (err) {
      setLoading(false);
      setButtonState("error");
      setError(err.message || "Failed to request");
      setTimeout(() => {
        setButtonState("idle");
        setError("");
      }, 3000);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    setButtonState("loading");
    setError("");
    try {
      await deleteRequest(item.id || item.Id);
      setLoading(false);
      setButtonState("idle");
      if (onClose) onClose();
      router.push("/request");
    } catch (err) {
      setLoading(false);
      setButtonState("error");
      setError(err.message || "Failed to cancel request");
      setTimeout(() => {
        setButtonState("idle");
        setError("");
      }, 3000);
    }
  };

  return (
    <dialog id="request_modal" ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl max-h-[80vh]">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={() => dialogRef.current && dialogRef.current.close()}
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">{cancelMode ? "Media Status" : "Request Content"}</h3>
        <div className="flex flex-col md:flex-row items-stretch mb-8 min-h-[15rem]">
          {(posterUrl || backdropUrl) && (
            <div className="flex-shrink-0 flex justify-center w-full md:w-auto h-full md:mr-8">
              {posterUrl && (
                <img src={posterUrl} alt="Poster" className="h-full max-h-[20rem] w-auto object-cover rounded shadow-lg" style={{ aspectRatio: '2/3' }} />
              )}
              {backdropUrl && !posterUrl && (
                <img src={backdropUrl} alt="Backdrop" className="h-full max-h-[20rem] w-auto object-cover rounded shadow-lg" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0 w-full flex flex-col justify-center ">
            {item.downloadInfo && (
              <div className="mb-4 sm:my-0 my-8">
                {item.downloadInfo.status === 'warning' ? <p className="text-xs mb-2">{item.downloadInfo.errorMessage}</p> : null}
                <div className="relative w-full flex items-center">
                  <progress
                    className={`progress ${item.downloadInfo.status === 'warning' ? 'progress-warning animate-pulse' : 'progress-info'} progress-bar progress-bar-striped w-full h-2 sm:h-3 bg-gray-700/40`}
                    value={item.downloadInfo.size - item.downloadInfo.sizeleft}
                    max={item.downloadInfo.size}
                    style={{ minWidth: 0 }}
                  ></progress>
                  <span className="ml-3 sm:text-xs text-sm text-black dark:text-white font-semibold drop-shadow-sm select-none">
                    {(() => {
                      let percent = 0;
                      if (item.downloadInfo.size > 0) {
                        percent = Math.round(((item.downloadInfo.size - item.downloadInfo.sizeleft) / item.downloadInfo.size) * 100);
                        if (isNaN(percent) || !isFinite(percent)) percent = 0;
                      }
                      return `${percent}%`;
                    })()}
                  </span>    
                </div>
              </div>
            )}
            {item.ratings && item.ratings.imdb ? (
                <section className="flex items-center gap-2 opacity-50 mt-2 sm:mt-6 mb-0 sm:mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                  <p className="text-sm">IMDb Rating: {item.ratings.imdb.value}</p>
                </section>
              ) : null}
            <h1 className="text-2xl font-bold break-words my-2 sm:my-0">{item.title || item.Name}</h1>
            <section className="flex items-center gap-2 opacity-50 mb-2">
              {(() => {
                const parts = [];
                if (item.year || item.ProductionYear) parts.push(<span key="year" className="text-sm" title="Release Year">{item.year || item.ProductionYear}</span>);
                if (item.studio) parts.push(<span key="studio" className="text-sm" title="Studio Name">{item.studio}</span>);
                if (item.genres && item.genres.length > 0) parts.push(<span key="genres" className="text-sm" title="Genres">{item.genres.join(", ")}</span>);
                return parts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="mx-1">|</span>}
                    {part}
                  </React.Fragment>
                ));
              })()}
            </section>
            <h2 className="text-sm sm:text-sm leading-[1.8] sm:leading-[1.75] text-justify break-words line-clamp-9">{item.overview || item.Overview || "No overview available."}</h2>
          </div>
        </div>
        <div className="modal-action mt-4 flex flex-col gap-2">
          {cancelMode ? (
            showConfirm ? (
              <div className="flex flex-col gap-2">
                <div className="mb-2 text-center">Are you sure you want to cancel this request?</div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    className="btn btn-error"
                    onClick={handleCancelRequest}
                    disabled={loading}
                  >
                    {buttonState === "loading" ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : null}
                    Yes, Cancel
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                  >
                    No
                  </button>
                </div>
                {buttonState === "error" && (
                  <div className="text-error text-center mt-2">{error}</div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-error w-full"
                onClick={() => setShowConfirm(true)}
                disabled={loading}
              >
                Cancel this request
              </button>
            )
          ) : (
            <button
              type="button"
              className={`btn w-full flex items-center justify-center ${
                buttonState === "loading"
                  ? "btn-primary btn-disabled"
                  : buttonState === "error"
                  ? "btn-error"
                  : "btn-primary"
              }`}
              onClick={handleRequest}
              disabled={loading}
            >
              {buttonState === "loading" && (
                <span className="loading loading-spinner loading-xs mr-2"></span>
              )}
              {buttonState === "idle" && "Request this content"}
              {buttonState === "loading" && "Requesting"}
              {buttonState === "error" && error}
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
