import { useEffect } from "react";

// Switches the page to Ilia State University colours (see "Iliauni colours" in
// base.css) while a page asks for them, with a short fade in and out.

let claims = 0; // how many mounted pages currently want the Iliauni colours
let fadeTimer;
let releaseTimer;

function setBrand(brand) {
  const root = document.documentElement;
  if ((root.dataset.brand ?? "") === (brand ?? "")) return;
  root.classList.add("brand-fade");
  if (brand) root.dataset.brand = brand;
  else delete root.dataset.brand;
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove("brand-fade"), 700);
}

export function useBrand(active) {
  useEffect(() => {
    if (!active) return undefined;
    claims += 1;
    clearTimeout(releaseTimer);
    setBrand("iliauni");
    return () => {
      claims -= 1;
      // Wait a moment before going back to the normal colours: when the next
      // page is also an Iliauni page (e.g. a meeting opened from the list) it
      // claims the colours as soon as its data has loaded, so they never flicker.
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        if (claims === 0) setBrand(null);
      }, 400);
    };
  }, [active]);
}
