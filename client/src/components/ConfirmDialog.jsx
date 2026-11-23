import { useEffect, useRef, useState } from "react";

// Asks before something destructive happens. Uses the native <dialog>,
// so focus is trapped and Escape closes it.
//
// <ConfirmDialog
//   open={Boolean(target)} title="Delete venue?" confirmLabel="Delete venue"
//   onConfirm={async () => ...} onClose={() => setTarget(null)}>
//   text
// </ConfirmDialog>
export default function ConfirmDialog({ open, title, children, confirmLabel = "Delete", onConfirm, onClose }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError("");
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{title}</h2>
      <div className="dialog__body">{children}</div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <div className="dialog__actions">
        <button type="button" className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={confirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
