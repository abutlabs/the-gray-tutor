// Pictures open full size, as in mdBook: click one, or tab to it and press Enter or Space.
// A click or Esc closes it. The Grafana screenshots and the diagrams are dense: this is how
// to read them.

let viewer: HTMLDialogElement | undefined;

function enlarge(picture: HTMLImageElement): void {
  if (!viewer) {
    viewer = document.createElement("dialog");
    viewer.id = "picture-zoom";
    viewer.addEventListener("click", () => viewer!.close());
    document.body.append(viewer);
  }
  const big = new Image();
  big.src = picture.currentSrc || picture.src;
  big.alt = picture.alt;
  // The diagrams are SVGs with a viewBox and no width or height: alone in the dialog they have
  // no size of their own and shrank to nothing, leaving only the dark backdrop. They open at
  // the shape they have on the page, as large as the screen allows.
  const { width, height } = picture.getBoundingClientRect();
  if (width > 0 && height > 0) big.style.setProperty("--ratio", String(width / height));
  viewer.replaceChildren(big);
  viewer.showModal();
}

/** A lesson's picture, not one inside a link (a click there should follow the link). */
function lessonPicture(target: EventTarget | null): HTMLImageElement | null {
  return target instanceof HTMLImageElement && target.matches(".vp-doc img") && !target.closest("a")
    ? target : null;
}

export function listenForZoom(): void {
  document.addEventListener("click", (e) => {
    const picture = lessonPicture(e.target);
    if (picture) enlarge(picture);
  });
  document.addEventListener("keydown", (e) => {
    const picture = lessonPicture(e.target);
    if (picture && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      enlarge(picture);
    }
  });
}

/** Lets the keyboard reach the pictures on the page, and says what Enter does. */
export function makePicturesFocusable(): void {
  for (const picture of document.querySelectorAll<HTMLImageElement>(".vp-doc img:not([tabindex])")) {
    if (picture.closest("a")) continue;
    picture.tabIndex = 0;
    picture.setAttribute("role", "button");
    picture.setAttribute("aria-label", `Enlarge: ${picture.alt}`);
  }
}
