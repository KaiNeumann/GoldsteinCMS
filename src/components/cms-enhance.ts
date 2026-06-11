/**
 * CMS Content Enhancement Module
 *
 * DOM enhancement pattern: runs after dangerouslySetInnerHTML renders,
 * finds custom HTML elements, and attaches interactivity.
 */

type Enhancer = (root: HTMLElement) => void;

const enhancers: Enhancer[] = [];

export function registerEnhancer(enhancer: Enhancer) {
  enhancers.push(enhancer);
}

export function enhanceCmsContent(root: HTMLElement) {
  for (const enhancer of enhancers) {
    enhancer(root);
  }
}

// Lightbox enhancer
function enhanceLightbox(root: HTMLElement) {
  const figures = root.querySelectorAll("figure:has(> img)");
  if (figures.length === 0) return;

  const images: { src: string; alt: string; caption: string }[] = [];
  figures.forEach((figure) => {
    const img = figure.querySelector("img");
    const figcaption = figure.querySelector("figcaption");
    if (img) {
      images.push({
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || "",
        caption: figcaption?.textContent || "",
      });
    }
  });

  figures.forEach((figure, index) => {
    const img = figure.querySelector("img");
    if (!img) return;

    (figure as HTMLElement).style.cursor = "zoom-in";
    figure.addEventListener("click", () => {
      openLightbox(images, index);
    });
  });
}

function openLightbox(
  images: { src: string; alt: string; caption: string }[],
  startIndex: number
) {
  let currentIndex = startIndex;

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-50 bg-black/90 flex items-center justify-center";

  const content = document.createElement("div");
  content.className = "relative max-w-4xl max-h-[90vh] mx-4";

  const img = document.createElement("img");
  img.className = "max-h-[80vh] mx-auto rounded-lg object-contain";

  const caption = document.createElement("div");
  caption.className = "text-white text-center mt-4 text-sm opacity-80";

  const closeBtn = document.createElement("button");
  closeBtn.className =
    "absolute top-4 right-4 text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors";
  closeBtn.innerHTML = "&times;";
  closeBtn.setAttribute("aria-label", "Schließen");

  const prevBtn = document.createElement("button");
  prevBtn.className =
    "absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors";
  prevBtn.innerHTML = "&#8249;";
  prevBtn.setAttribute("aria-label", "Vorheriges Bild");

  const nextBtn = document.createElement("button");
  nextBtn.className =
    "absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors";
  nextBtn.innerHTML = "&#8250;";
  nextBtn.setAttribute("aria-label", "Nächstes Bild");

  const counter = document.createElement("div");
  counter.className = "absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm";

  function updateImage() {
    const item = images[currentIndex];
    img.src = item.src;
    img.alt = item.alt;
    caption.textContent = item.caption;
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
    prevBtn.style.display = images.length > 1 ? "flex" : "none";
    nextBtn.style.display = images.length > 1 ? "flex" : "none";
  }

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", handleKeydown);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      currentIndex--;
      updateImage();
    }
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
      currentIndex++;
      updateImage();
    }
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      currentIndex--;
      updateImage();
    }
  });
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      currentIndex++;
      updateImage();
    }
  });

  content.append(img, caption, closeBtn, prevBtn, nextBtn, counter);
  overlay.append(content);
  document.body.append(overlay);

  document.addEventListener("keydown", handleKeydown);
  updateImage();
}

// Slider enhancer
function enhanceSlider(root: HTMLElement) {
  const sliders = root.querySelectorAll(".gf-slider");
  sliders.forEach((container) => {
    const figures = container.querySelectorAll("figure");
    if (figures.length === 0) return;

    const autoplay = parseInt(container.getAttribute("data-autoplay") || "0");
    const loop = container.getAttribute("data-loop") !== "false";

    const track = document.createElement("div");
    track.className = "flex transition-transform duration-300 ease-in-out";

    const slides: HTMLElement[] = [];
    figures.forEach((figure) => {
      const slide = document.createElement("div");
      slide.className = "flex-shrink-0 w-full";
      slide.appendChild(figure.cloneNode(true));
      track.appendChild(slide);
      slides.push(slide);
    });

    const prevBtn = document.createElement("button");
    prevBtn.className =
      "absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10";
    prevBtn.innerHTML = "&#8249;";
    prevBtn.setAttribute("aria-label", "Vorheriges Bild");

    const nextBtn = document.createElement("button");
    nextBtn.className =
      "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10";
    nextBtn.innerHTML = "&#8250;";
    nextBtn.setAttribute("aria-label", "Nächstes Bild");

    const dots = document.createElement("div");
    dots.className = "flex justify-center gap-2 mt-4";

    let currentIndex = 0;

    function updateSlider() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.querySelectorAll("button").forEach((dot, i) => {
        dot.classList.toggle("bg--primary", i === currentIndex);
        dot.classList.toggle("bg-gray-300", i !== currentIndex);
      });
    }

    function goTo(index: number) {
      currentIndex = index;
      if (currentIndex < 0) currentIndex = loop ? slides.length - 1 : 0;
      if (currentIndex >= slides.length)
        currentIndex = loop ? 0 : slides.length - 1;
      updateSlider();
    }

    prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
    nextBtn.addEventListener("click", () => goTo(currentIndex + 1));

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className =
        "w-3 h-3 rounded-full bg-gray-300 hover:bg--primary transition-colors";
      dot.setAttribute("aria-label", `Bild ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dots.appendChild(dot);
    });

    (container as HTMLElement).style.position = "relative";
    (container as HTMLElement).style.overflow = "hidden";
    track.style.width = "100%";
    container.textContent = "";
    container.append(track, prevBtn, nextBtn, dots);

    updateSlider();

    if (autoplay > 0) {
      let interval: ReturnType<typeof setInterval>;
      const startAutoplay = () => {
        interval = setInterval(() => {
          goTo(currentIndex + 1);
        }, autoplay);
      };
      const stopAutoplay = () => clearInterval(interval);

      container.addEventListener("mouseenter", stopAutoplay);
      container.addEventListener("mouseleave", startAutoplay);

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) startAutoplay();
          else stopAutoplay();
        },
        { threshold: 0.5 }
      );
      observer.observe(container);

      startAutoplay();
    }
  });
}

// Gallery enhancer
function enhanceGallery(root: HTMLElement) {
  const galleries = root.querySelectorAll(".gf-gallery");
  galleries.forEach((container) => {
    const columns = container.getAttribute("data-columns") || "3";
    const figures = container.querySelectorAll("figure");

    container.classList.add("grid", `grid-cols-${columns}`, "gap-4");

    figures.forEach((figure) => {
      const img = figure.querySelector("img");
      if (img) {
        img.classList.add("w-full", "aspect-square", "object-cover", "rounded-lg");
        img.setAttribute("loading", "lazy");
      }
      figure.classList.add("overflow-hidden", "rounded-lg");
    });
  });
}

// Collapsible enhancer
function enhanceCollapsible(root: HTMLElement) {
  const collapsibles = root.querySelectorAll("details.gf-collapsible");
  collapsibles.forEach((details) => {
    const summary = details.querySelector("summary");
    if (!summary) return;

    const chevron = document.createElement("span");
    chevron.className =
      "inline-block transition-transform duration-200 mr-2 text--primary";
    chevron.innerHTML = "&#9656;";
    summary.prepend(chevron);

    details.addEventListener("toggle", () => {
      chevron.style.transform = details.open ? "rotate(90deg)" : "rotate(0)";
    });
  });
}

// Accordion enhancer
function enhanceAccordion(root: HTMLElement) {
  const accordions = root.querySelectorAll(".gf-accordion");
  accordions.forEach((container) => {
    const details = container.querySelectorAll("details.gf-accordion-item");
    details.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (item.open) {
          details.forEach((other) => {
            if (other !== item) other.removeAttribute("open");
          });
        }
      });
    });
  });
}

// Callout enhancer
function enhanceCallout(root: HTMLElement) {
  const callouts = root.querySelectorAll(".gf-callout");
  const icons: Record<string, string> = {
    info: "&#8505;",
    warning: "&#9888;",
    success: "&#10003;",
    tip: "&#128161;",
  };

  callouts.forEach((callout) => {
    const type = callout.getAttribute("data-type") || "info";
    callout.classList.add(
      "border-l-4",
      "rounded-r-lg",
      "p-4",
      "my-4"
    );

    const colors: Record<string, string> = {
      info: "border-blue-400 bg-blue-50",
      warning: "border-amber-400 bg-amber-50",
      success: "border-green-400 bg-green-50",
      tip: "border-purple-400 bg-purple-50",
    };

    callout.classList.add(...(colors[type] || colors.info).split(" "));

    const icon = document.createElement("span");
    icon.className = "mr-2 text-lg";
    icon.innerHTML = icons[type] || icons.info;
    callout.prepend(icon);
  });
}

// Table wrapper enhancer
function enhanceTable(root: HTMLElement) {
  const wrappers = root.querySelectorAll(".gf-table-wrap");
  wrappers.forEach((wrapper) => {
    const table = wrapper.querySelector("table");
    if (table) {
      wrapper.classList.add("overflow-x-auto", "rounded-lg", "border", "border-border");
      table.classList.add("w-full", "text-sm");
    }
  });
}

// Register all enhancers
registerEnhancer(enhanceLightbox);
registerEnhancer(enhanceSlider);
registerEnhancer(enhanceGallery);
registerEnhancer(enhanceCollapsible);
registerEnhancer(enhanceAccordion);
registerEnhancer(enhanceCallout);
registerEnhancer(enhanceTable);
