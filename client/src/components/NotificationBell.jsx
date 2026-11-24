import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { navigate, usePath } from "../router.jsx";

const POLL_MS = 30000;

// "5 min ago", "3 h ago", "2 d ago". created_at is UTC from SQLite.
function ago(value) {
  const seconds = Math.max(0, (Date.now() - new Date(value.replace(" ", "T") + "Z")) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

// Bell in the header with the number of unread notifications and a dropdown.
// It checks for new ones every 30 seconds and whenever the page changes.
export default function NotificationBell() {
  const [data, setData] = useState({ unread: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0); // phones: the panel sits right under the bell
  const ref = useRef(null);
  const path = usePath();

  const load = useCallback(async () => {
    try {
      setData(await api("/notifications"));
    } catch {
      // keep the last list; the next check will try again
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    setOpen(false);
    load();
  }, [path, load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector(".bell")?.focus();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = async (item) => {
    if (!item.read_at) {
      try {
        await api(`/notifications/${item.id}/read`, { method: "POST" });
      } catch {
        // not critical
      }
    }
    setOpen(false);
    if (item.link) navigate(item.link);
    load();
  };

  const readAll = async () => {
    await api("/notifications/read-all", { method: "POST" });
    load();
  };

  const label = data.unread ? `Notifications, ${data.unread} unread` : "Notifications";

  return (
    <div className="notif" ref={ref}>
      <button
        type="button"
        className="btn btn--ghost btn--small bell"
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          setTop(e.currentTarget.getBoundingClientRect().bottom + 8);
          setOpen((o) => !o);
        }}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path
            d="M10 2.5a5 5 0 0 0-5 5v3.2L3.6 13.4c-.3.5 0 1.1.6 1.1h11.6c.6 0 .9-.6.6-1.1L15 10.7V7.5a5 5 0 0 0-5-5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M8 16.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {data.unread > 0 && <span className="bell__count mono">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>

      {open && (
        <div className="notif__panel" role="dialog" aria-label="Notifications" style={{ "--notif-top": `${top}px` }}>
          <div className="notif__head">
            <strong>Notifications</strong>
            {data.unread > 0 && (
              <button type="button" className="link-btn" onClick={readAll}>
                Mark all as read
              </button>
            )}
          </div>
          {data.items.length === 0 ? (
            <p className="notif__empty">Nothing yet. Updates about your events and requests will show up here.</p>
          ) : (
            <ul className="notif__list">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notif__item${item.read_at ? "" : " is-unread"}`}
                    onClick={() => openItem(item)}
                  >
                    <span className="notif__dot" aria-hidden="true" />
                    <span className="notif__text">
                      {item.message}
                      <span className="notif__time mono">{ago(item.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
