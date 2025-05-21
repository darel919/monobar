import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRequest, deleteRequest } from "../lib/api";

export default function RequestModal({ open, onClose, item, cancelMode }) {
  const router = useRouter();
  const dialogRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buttonState, setButtonState] = useState("idle"); // idle | loading | error
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
    // Listen for close event to sync state
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
        <h3 className="font-bold text-lg mb-4">{cancelMode ? "Cancel Request" : "Request Content"}</h3>
        <div className="flex flex-col md:flex-row items-stretch mb-8 min-h-[15rem]">
          <div className="flex-shrink-0 flex justify-center w-full md:w-auto h-full">
            {posterUrl && (
              <img src={posterUrl} alt="Poster" className="h-full max-h-[20rem] w-auto object-cover rounded shadow-lg" style={{ aspectRatio: '2/3' }} />
            )}
            {backdropUrl && !posterUrl && (
              <img src={backdropUrl} alt="Backdrop" className="h-full max-h-[20rem] w-auto object-cover rounded shadow-lg" />
            )}
          </div>
          <div className="flex-1 min-w-0 w-full flex flex-col justify-center">
            <h3 className="opacity-50 text-sm mb-1">{item.year || item.ProductionYear || "Unknown"}</h3>
            <h1 className="text-2xl font-bold mb-2 break-words">{item.title || item.Name}</h1>
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
