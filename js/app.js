(function () {
  const ENRICH_ENDPOINT = "https://api.openlib.in/content/enrich";
  const DRAFT_STORAGE_KEY = "mdx.markdownDraft.v1";
  const IMAGE_WIDTH = 1080;
  const IMAGE_HEIGHT = 1350;
  const IMAGE_THEME = {
    classic: { background: "#fffdf8", ink: "#25221e", muted: "#6c665d", heading: "#171411", accent: "#a9572c", soft: "#f1dfd2", code: "#f3eee7", border: "#d8cfc3" },
    executive: { background: "#f5f8fa", ink: "#263447", muted: "#66758a", heading: "#142c4c", accent: "#267d88", soft: "#dceff0", code: "#e8eef2", border: "#c9d5df" },
    warm: { background: "#fff4e4", ink: "#4b3428", muted: "#806453", heading: "#71351f", accent: "#c26a32", soft: "#f5dfc9", code: "#f5e3cd", border: "#dfc4a8" },
    dark: { background: "#171d25", ink: "#e6e9ed", muted: "#a4afbc", heading: "#ffffff", accent: "#f2a65a", soft: "#3a2e25", code: "#0e141b", border: "#3b4653" },
  };
  const IMAGE_FONTS = {
    "dm-sans": "DM Sans",
    manrope: "Manrope",
    lato: "Lato",
    montserrat: "Montserrat",
  };
  const SAMPLE = `# Ideas to impact

### A concise field guide to making complex work easier to understand.

Great communication turns **good thinking into shared momentum**. Use this sample to explore a clean document layout, then switch to presentation mode to see each chapter as a slide.

> Clarity is not less detail. It is the right detail, in the right order.

---

# Make the important obvious

Bring the core message forward. Give each section one job, use specific language, and let supporting detail earn its place.

- Lead with the decision or insight
- Group related evidence together
- Keep every page focused on one idea

### A simple test

Can someone understand the point in **ten seconds** and explain what happens next?

---

# Turn understanding into action

Strong documents help a team move from discussion to clear ownership.

| Moment | Useful outcome |
| --- | --- |
| Align | One shared view of the goal |
| Decide | A clear choice with its rationale |
| Act | An owner, a next step, and a date |

**The result:** less time translating information, more time doing meaningful work.
`;

  const els = {
    mdFile: document.getElementById("md-file"),
    uploadFile: document.getElementById("upload-file"),
    uploadFolder: document.getElementById("upload-folder"),
    folderInput: document.getElementById("folder-input"),
    themeSelect: document.getElementById("theme-select"),
    fontSelect: document.getElementById("font-select"),
    exportBtn: document.getElementById("export-btn"),
    enrichBtn: document.getElementById("enrich-btn"),
    enrichDialog: document.getElementById("enrich-dialog"),
    enrichForm: document.getElementById("enrich-form"),
    enrichPrompt: document.getElementById("enrich-prompt"),
    enrichSubmit: document.getElementById("enrich-submit"),
    enrichSubmitLabel: document.querySelector(".enrich-submit-label"),
    enrichTitle: document.getElementById("enrich-title"),
    enrichPromptLabel: document.querySelector(".prompt-label"),
    enrichNote: document.getElementById("enrich-note"),
    enrichCancel: document.getElementById("enrich-cancel"),
    enrichClose: document.getElementById("enrich-close"),
    enrichError: document.getElementById("enrich-error"),
    imageDownloadDialog: document.getElementById("image-download-dialog"),
    imageDownloadClose: document.getElementById("image-download-close"),
    imageDownloadList: document.getElementById("image-download-list"),
    exportScopeWrap: document.getElementById("export-scope-wrap"),
    exportScopeLabel: document.getElementById("export-scope-label"),
    exportScope: document.getElementById("export-scope"),
    mdInput: document.getElementById("md-input"),
    preview: document.getElementById("preview"),
    previewFrame: document.getElementById("preview-frame"),
    fileStatus: document.getElementById("file-status"),
    pptControls: document.getElementById("ppt-controls"),
    prevSlide: document.getElementById("prev-slide"),
    nextSlide: document.getElementById("next-slide"),
    slidePos: document.getElementById("slide-pos"),
    presentBtn: document.getElementById("present-btn"),
    exitPresent: document.getElementById("exit-present"),
    presentPos: document.getElementById("present-pos"),
    tabs: Array.from(document.querySelectorAll(".mode-tab")),
  };

  const state = {
    mode: "pdf",
    theme: "classic",
    font: "dm-sans",
    slideIndex: 0,
    presenting: false,
    folderHint: "",
    enriching: false,
  };
  let imageDownloadUrls = [];

  if (window.marked) {
    window.marked.setOptions({ gfm: true });
  }

  function setStatus(text) {
    els.fileStatus.textContent = text;
  }

  function applyTheme() {
    els.previewFrame.className = `preview-frame theme-${state.theme}`;
    document.getElementById("preview-stage").className = `preview-stage theme-${state.theme}`;
    const pptClass = state.mode !== "pdf" ? " ppt-mode" : "";
    els.preview.className = `preview-body md-${state.theme} font-${state.font}${pptClass}`;
  }

  function slides() {
    return Array.from(els.preview.querySelectorAll(".slide"));
  }

  function updateSlideChrome(count) {
    const label = count ? `${state.slideIndex + 1} / ${count}` : "0 / 0";
    els.slidePos.textContent = label;
    els.presentPos.textContent = label;
    els.prevSlide.disabled = !count || state.slideIndex <= 0;
    els.nextSlide.disabled = !count || state.slideIndex >= count - 1;
  }

  function showSlide(index) {
    const items = slides();
    if (!items.length) {
      updateSlideChrome(0);
      return;
    }
    state.slideIndex = Math.max(0, Math.min(index, items.length - 1));
    items.forEach((slide, i) => slide.classList.toggle("is-active", i === state.slideIndex));
    updateSlideChrome(items.length);
  }

  function setPresenting(on) {
    state.presenting = Boolean(on) && state.mode === "ppt";
    document.body.classList.toggle("is-presenting", state.presenting);
    els.exitPresent.classList.toggle("is-hidden", !state.presenting);
    els.presentPos.classList.toggle("is-hidden", !state.presenting);
    if (state.presenting) {
      const root = document.documentElement;
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function render() {
    applyTheme();
    const presentation = state.mode !== "pdf";
    els.preview.innerHTML = window.MDX.renderPreview(els.mdInput.value, presentation ? "ppt" : "pdf");
    els.pptControls.classList.toggle("is-hidden", !presentation);
    els.presentBtn.classList.toggle("is-hidden", state.mode !== "ppt");
    els.exportScopeWrap.classList.toggle("is-hidden", !presentation);
    els.exportScopeLabel.textContent = state.mode === "img" ? "Image range" : "Deck range";
    els.prevSlide.classList.toggle("is-hidden", !presentation);
    els.nextSlide.classList.toggle("is-hidden", !presentation);
    els.exportBtn.querySelector("span").textContent = "Export";
    if (presentation) showSlide(state.slideIndex);
    else setPresenting(false);
  }

  function setMode(mode) {
    if (mode !== "ppt") setPresenting(false);
    state.mode = mode;
    els.tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    state.slideIndex = 0;
    render();
  }

  async function readTextFile(file) {
    return file.text();
  }

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, els.mdInput.value);
      setStatus("Draft saved in this browser");
    } catch (error) {
      setStatus("Could not save draft in this browser");
      console.error("Could not save the Markdown draft", error);
    }
  }

  function clearImageDownloads() {
    imageDownloadUrls.forEach((url) => URL.revokeObjectURL(url));
    imageDownloadUrls = [];
    els.imageDownloadList.replaceChildren();
  }

  function showImageDownloads(images) {
    clearImageDownloads();
    images.forEach(({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      imageDownloadUrls.push(url);
      const link = document.createElement("a");
      link.className = "btn btn-accent";
      link.href = url;
      link.download = filename;
      link.textContent = filename;
      els.imageDownloadList.appendChild(link);
    });
    els.imageDownloadDialog.showModal();
  }

  function collectTextSegments(node, inherited = {}, segments = []) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue) segments.push({ text: node.nodeValue, ...inherited });
      return segments;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return segments;
    const tag = node.tagName.toLowerCase();
    const style = {
      ...inherited,
      bold: inherited.bold || tag === "strong" || tag === "b",
      italic: inherited.italic || tag === "em" || tag === "i",
      code: inherited.code || tag === "code",
      color: tag === "a" ? IMAGE_THEME[state.theme].accent : inherited.color,
    };
    if (tag === "img") {
      segments.push({ text: node.alt || "", ...style });
      return segments;
    }
    node.childNodes.forEach((child) => collectTextSegments(child, style, segments));
    return segments;
  }

  function canvasFont(segment, fontSize, fontFamily) {
    const weight = segment.bold ? "700 " : "400 ";
    const italic = segment.italic ? "italic " : "";
    const family = segment.code ? "Consolas, monospace" : `"${fontFamily}", Arial, sans-serif`;
    return `${italic}${weight}${fontSize}px ${family}`;
  }

  function drawWrappedText(context, segments, x, y, maxWidth, fontSize, lineHeight, color, fontFamily) {
    let line = [];
    let lineWidth = 0;
    const drawLine = () => {
      let cursorX = x;
      line.forEach((part) => {
        context.font = canvasFont(part, fontSize, fontFamily);
        context.fillStyle = part.color || color;
        context.fillText(part.text, cursorX, y);
        cursorX += context.measureText(part.text).width;
      });
      y += lineHeight;
      line = [];
      lineWidth = 0;
    };

    segments.forEach((segment) => {
      const words = segment.text.split(/(\s+)/).filter(Boolean);
      words.forEach((word) => {
        context.font = canvasFont(segment, fontSize, fontFamily);
        const wordWidth = context.measureText(word).width;
        if (/^\s+$/.test(word) && line.length === 0) return;
        if (line.length && lineWidth + wordWidth > maxWidth) drawLine();
        line.push({ text: word, ...segment });
        lineWidth += wordWidth;
      });
    });
    if (line.length) drawLine();
    return y;
  }

  function loadSlideImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (/^https?:/i.test(source)) image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load slide image: ${source}`));
      image.src = source;
    });
  }

  function ensureImageFits(y) {
    if (y > IMAGE_HEIGHT - 72) {
      throw new Error("Slide content is too long for an Instagram image. Split it with --- to make more slides.");
    }
  }

  async function slideImageBlob(slide) {
    await document.fonts.ready;
    const palette = IMAGE_THEME[state.theme];
    const fontFamily = IMAGE_FONTS[state.font] || IMAGE_FONTS["dm-sans"];
    const canvas = document.createElement("canvas");
    canvas.width = IMAGE_WIDTH;
    canvas.height = IMAGE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create an image canvas");

    context.fillStyle = palette.background;
    context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
    context.textBaseline = "top";
    const left = 72;
    const width = IMAGE_WIDTH - left * 2;
    let y = 72;

    for (const element of Array.from(slide.children)) {
      const tag = element.tagName.toLowerCase();
      if (tag === "hr") {
        y += 14;
        context.strokeStyle = palette.border;
        context.beginPath();
        context.moveTo(left, y);
        context.lineTo(IMAGE_WIDTH - left, y);
        context.stroke();
        y += 24;
        ensureImageFits(y);
        continue;
      }

      if (tag === "img" || (tag === "p" && element.children.length === 1 && element.firstElementChild.tagName === "IMG")) {
        const imageElement = tag === "img" ? element : element.firstElementChild;
        const image = await loadSlideImage(imageElement.src);
        const scale = Math.min(width / image.naturalWidth, 420 / image.naturalHeight, 1);
        const imageWidth = image.naturalWidth * scale;
        const imageHeight = image.naturalHeight * scale;
        if (y + imageHeight + 24 > IMAGE_HEIGHT - 72) {
          throw new Error("Slide content is too long for an Instagram image. Split it with --- to make more slides.");
        }
        context.drawImage(image, left, y, imageWidth, imageHeight);
        y += imageHeight + 24;
        ensureImageFits(y);
        continue;
      }

      if (tag === "table") {
        const rows = Array.from(element.querySelectorAll("tr"));
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.children);
          const segments = [];
          cells.forEach((cell, cellIndex) => {
            if (cellIndex) segments.push({ text: "  |  " });
            segments.push(...collectTextSegments(cell, { bold: rowIndex === 0 }));
          });
          y = drawWrappedText(context, segments, left, y, width, 25, 34, palette.ink, fontFamily) + 10;
        });
        y += 14;
        ensureImageFits(y);
        continue;
      }

      if (tag === "ul" || tag === "ol") {
        Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "li").forEach((item, index) => {
          const marker = tag === "ol" ? `${index + 1}. ` : "• ";
          context.font = `400 30px "${fontFamily}", Arial, sans-serif`;
          context.fillStyle = palette.accent;
          context.fillText(marker, left + 8, y);
          y = drawWrappedText(context, collectTextSegments(item), left + 46, y, width - 46, 30, 43, palette.ink, fontFamily) + 8;
          ensureImageFits(y);
        });
        y += 8;
        ensureImageFits(y);
        continue;
      }

      if (tag === "blockquote") {
        context.fillStyle = palette.accent;
        context.fillRect(left, y, 5, 48);
        y = drawWrappedText(context, collectTextSegments(element), left + 20, y, width - 20, 28, 42, palette.ink, fontFamily) + 18;
        ensureImageFits(y);
        continue;
      }

      if (tag === "pre") {
        const segments = collectTextSegments(element, { code: true });
        y = drawWrappedText(context, segments, left + 12, y, width - 24, 23, 32, palette.ink, fontFamily) + 22;
        ensureImageFits(y);
        continue;
      }

      const heading = /^h[1-3]$/.test(tag);
      const fontSize = tag === "h1" ? 54 : tag === "h2" ? 40 : tag === "h3" ? 34 : 30;
      const color = heading ? palette.heading : palette.ink;
      if (tag === "h2" || tag === "h3") y += 12;
      y = drawWrappedText(context, collectTextSegments(element), left, y, width, fontSize, Math.round(fontSize * 1.35), color, fontFamily) + (heading ? 16 : 20);
      if (tag === "h1") {
        context.strokeStyle = palette.accent;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(left, y - 10);
        context.lineTo(IMAGE_WIDTH - left, y - 10);
        context.stroke();
        y += 8;
      }

      ensureImageFits(y);
    }

    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Your browser could not create a PNG image"));
        }, "image/png");
      } catch (error) {
        reject(error);
      }
    });
  }

  async function downloadImages() {
    const allSlides = slides();
    const selectedSlides = els.exportScope.value === "current"
      ? [allSlides[state.slideIndex]].filter(Boolean)
      : allSlides;
    if (!selectedSlides.length) {
      setStatus("There are no slides to download");
      return;
    }

    els.exportBtn.disabled = true;
    try {
      const images = [];
      for (let index = 0; index < selectedSlides.length; index += 1) {
        const blob = await slideImageBlob(selectedSlides[index]);
        const slideNumber = els.exportScope.value === "current" ? state.slideIndex + 1 : index + 1;
        images.push({ blob, filename: `mdx-instagram-${String(slideNumber).padStart(2, "0")}.png` });
      }
      showImageDownloads(images);
      setStatus(`${selectedSlides.length} Instagram image${selectedSlides.length === 1 ? "" : "s"} ready to download`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not download images");
      console.error("Could not export Markdown slides as images", error);
    } finally {
      els.exportBtn.disabled = false;
    }
  }

  function openEnrichDialog() {
    const hasContent = Boolean(els.mdInput.value.trim());
    els.enrichError.hidden = true;
    els.enrichError.textContent = "";
    els.enrichPrompt.value = "";
    els.enrichTitle.textContent = hasContent ? "Improve your Markdown" : "Create Markdown with AI";
    els.enrichPromptLabel.textContent = hasContent ? "What would you like to change?" : "What would you like to create?";
    els.enrichPrompt.placeholder = hasContent
      ? "For example: Make this more concise and add a short summary at the top."
      : "For example: Draft a concise project proposal with goals, milestones, and risks.";
    els.enrichNote.textContent = hasContent
      ? "Your current Markdown will be sent with this instruction and replaced only after a successful response."
      : "Your instruction will be used to create Markdown from scratch.";
    els.enrichSubmitLabel.textContent = hasContent ? "Improve Markdown" : "Create Markdown";
    els.enrichDialog.showModal();
    els.enrichPrompt.focus();
  }

  function closeEnrichDialog() {
    if (!state.enriching) els.enrichDialog.close();
  }

  async function enrichMarkdown(event) {
    event.preventDefault();
    const prompt = els.enrichPrompt.value.trim();
    const content = els.mdInput.value;
    if (!prompt) return;

    state.enriching = true;
    els.enrichSubmit.disabled = true;
    els.enrichCancel.disabled = true;
    els.enrichClose.disabled = true;
    els.enrichPrompt.disabled = true;
    els.enrichSubmitLabel.textContent = "Working…";
    els.enrichError.hidden = true;
    setStatus(content.trim() ? "Improving Markdown…" : "Creating Markdown…");

    try {
      const response = await fetch(ENRICH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, prompt, contentType: "md" }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message = payload && (payload.error || payload.message);
        throw new Error(message || `Enrichment failed (${response.status})`);
      }

      const enriched = typeof payload === "string"
        ? payload
        : payload && (payload.content ?? (payload.data && payload.data.content) ?? payload.markdown);
      if (typeof enriched !== "string" || !enriched.trim()) {
        throw new Error("The enrichment service returned no Markdown content");
      }

      els.mdInput.value = enriched;
      saveDraft();
      state.slideIndex = 0;
      render();
      setStatus(content.trim() ? "AI improvement complete" : "AI draft created");
      els.enrichDialog.close();
    } catch (error) {
      els.enrichError.textContent = error instanceof Error ? error.message : "Could not enrich this Markdown";
      els.enrichError.hidden = false;
      setStatus("AI enrichment failed");
    } finally {
      state.enriching = false;
      els.enrichSubmit.disabled = false;
      els.enrichCancel.disabled = false;
      els.enrichClose.disabled = false;
      els.enrichPrompt.disabled = false;
      els.enrichSubmitLabel.textContent = content.trim() ? "Improve Markdown" : "Create Markdown";
    }
  }

  els.uploadFile.addEventListener("click", async () => {
    const file = els.mdFile.files && els.mdFile.files[0];
    if (!file) {
      setStatus("Choose a markdown file first");
      return;
    }
    els.mdInput.value = await readTextFile(file);
    saveDraft();
    setStatus(file.name);
    state.slideIndex = 0;
    render();
  });

  els.uploadFolder.addEventListener("click", () => {
    els.folderInput.click();
  });

  els.folderInput.addEventListener("change", async () => {
    const files = Array.from(els.folderInput.files || []);
    if (!files.length) return;

    const mapped = window.MDX.registerFolderFiles(files);
    const mdCandidates = files.filter((file) => /\.(md|markdown|txt)$/i.test(file.name));
    const currentName = (els.mdFile.files[0] && els.mdFile.files[0].name) || "";

    if (!els.mdInput.value.trim() && mdCandidates.length) {
      const preferred =
        mdCandidates.find((file) => file.name === currentName) ||
        mdCandidates.find((file) => /readme/i.test(file.name)) ||
        mdCandidates[0];
      els.mdInput.value = await readTextFile(preferred);
      saveDraft();
      setStatus(`${preferred.name} · ${mapped.imageCount} images`);
    } else {
      setStatus(`${mapped.imageCount} images mapped from folder`);
    }

    state.folderHint = `${mapped.imageCount} images`;
    state.slideIndex = 0;
    render();
  });

  els.mdInput.addEventListener("input", () => {
    state.slideIndex = Math.min(state.slideIndex, Math.max(0, window.MDX.splitSlides(els.mdInput.value).length - 1));
    saveDraft();
    render();
  });

  els.enrichBtn.addEventListener("click", openEnrichDialog);
  els.enrichForm.addEventListener("submit", enrichMarkdown);
  els.enrichCancel.addEventListener("click", closeEnrichDialog);
  els.enrichClose.addEventListener("click", closeEnrichDialog);
  els.enrichDialog.addEventListener("cancel", (event) => {
    if (state.enriching) event.preventDefault();
  });
  els.imageDownloadClose.addEventListener("click", () => els.imageDownloadDialog.close());
  els.imageDownloadDialog.addEventListener("close", clearImageDownloads);

  els.themeSelect.addEventListener("change", () => {
    state.theme = els.themeSelect.value;
    render();
  });

  els.fontSelect.addEventListener("change", () => {
    state.font = els.fontSelect.value;
    render();
  });

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  els.prevSlide.addEventListener("click", () => showSlide(state.slideIndex - 1));
  els.nextSlide.addEventListener("click", () => showSlide(state.slideIndex + 1));
  els.presentBtn.addEventListener("click", () => setPresenting(true));
  els.exitPresent.addEventListener("click", () => setPresenting(false));

  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && state.presenting) setPresenting(false);
  });

  document.addEventListener("keydown", (event) => {
    if (state.mode === "pdf") return;
    if (event.key === "Escape" && state.presenting) {
      setPresenting(false);
      return;
    }
    if (event.target === els.mdInput && !state.presenting) return;
    if (event.key === "ArrowLeft") showSlide(state.slideIndex - 1);
    if (event.key === "ArrowRight") showSlide(state.slideIndex + 1);
  });

  els.exportBtn.addEventListener("click", () => {
    if (state.mode === "img") {
      downloadImages();
      return;
    }
    window.MDX.exportPreview({
      mode: state.mode,
      scope: state.mode === "ppt" ? els.exportScope.value : "all",
    });
  });

  try {
    const savedDraft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    els.mdInput.value = savedDraft === null ? SAMPLE : savedDraft;
    if (savedDraft !== null) setStatus("Draft restored from this browser");
  } catch (error) {
    els.mdInput.value = SAMPLE;
    setStatus("Could not restore a saved draft");
    console.error("Could not restore the Markdown draft", error);
  }
  render();
})();
