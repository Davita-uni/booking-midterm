// Page links under a list: ← Previous · 1 2 3 … 9 · Next →
// Shows every page when there are few, otherwise the first, the last and the
// pages around the current one.
function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  const list = [];
  for (let p = 1; p <= pages; p++) {
    if (wanted.has(p)) list.push(p);
    else if (list.at(-1) !== "…") list.push("…");
  }
  return list;
}

export default function Pagination({ page, pages, total, pageSize, onChange, noun = "events" }) {
  if (pages <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <nav className="pagination" aria-label="Pages">
      <p className="pagination__info">
        {first}–{last} of {total} {noun}
      </p>
      <div className="pagination__pages">
        <button type="button" className="pagination__step" disabled={page === 1} onClick={() => onChange(page - 1)}>
          ← Previous
        </button>
        {pageList(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap${i}`} className="pagination__gap" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination__page mono${p === page ? " is-current" : ""}`}
              aria-current={p === page ? "page" : undefined}
              aria-label={`Page ${p}`}
              onClick={() => p !== page && onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="pagination__step" disabled={page === pages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </nav>
  );
}
