(function () {
  const ENRICH_ENDPOINT = "https://api.openlib.in/content/enrich";
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
    exportScopeWrap: document.getElementById("export-scope-wrap"),
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

  if (window.marked) {
    window.marked.setOptions({ gfm: true });
  }

  function setStatus(text) {
    els.fileStatus.textContent = text;
  }

  function applyTheme() {
    els.previewFrame.className = `preview-frame theme-${state.theme}`;
    document.getElementById("preview-stage").className = `preview-stage theme-${state.theme}`;
    const pptClass = state.mode === "ppt" ? " ppt-mode" : "";
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
    els.preview.innerHTML = window.MDXMarkdown.renderPreview(els.mdInput.value, state.mode);
    const ppt = state.mode === "ppt";
    els.pptControls.classList.toggle("is-hidden", !ppt);
    els.exportScopeWrap.classList.toggle("is-hidden", !ppt);
    els.prevSlide.classList.toggle("is-hidden", !ppt);
    els.nextSlide.classList.toggle("is-hidden", !ppt);
    if (ppt) showSlide(state.slideIndex);
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

    const mapped = window.MDXMarkdown.registerFolderFiles(files);
    const mdCandidates = files.filter((file) => /\.(md|markdown|txt)$/i.test(file.name));
    const currentName = (els.mdFile.files[0] && els.mdFile.files[0].name) || "";

    if (!els.mdInput.value.trim() && mdCandidates.length) {
      const preferred =
        mdCandidates.find((file) => file.name === currentName) ||
        mdCandidates.find((file) => /readme/i.test(file.name)) ||
        mdCandidates[0];
      els.mdInput.value = await readTextFile(preferred);
      setStatus(`${preferred.name} · ${mapped.imageCount} images`);
    } else {
      setStatus(`${mapped.imageCount} images mapped from folder`);
    }

    state.folderHint = `${mapped.imageCount} images`;
    state.slideIndex = 0;
    render();
  });

  els.mdInput.addEventListener("input", () => {
    state.slideIndex = Math.min(state.slideIndex, Math.max(0, window.MDXMarkdown.splitSlides(els.mdInput.value).length - 1));
    render();
  });

  els.enrichBtn.addEventListener("click", openEnrichDialog);
  els.enrichForm.addEventListener("submit", enrichMarkdown);
  els.enrichCancel.addEventListener("click", closeEnrichDialog);
  els.enrichClose.addEventListener("click", closeEnrichDialog);
  els.enrichDialog.addEventListener("cancel", (event) => {
    if (state.enriching) event.preventDefault();
  });

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
    if (state.mode !== "ppt") return;
    if (event.key === "Escape" && state.presenting) {
      setPresenting(false);
      return;
    }
    if (event.target === els.mdInput && !state.presenting) return;
    if (event.key === "ArrowLeft") showSlide(state.slideIndex - 1);
    if (event.key === "ArrowRight") showSlide(state.slideIndex + 1);
  });

  els.exportBtn.addEventListener("click", () => {
    window.MDXExport.exportPreview({
      mode: state.mode,
      scope: state.mode === "ppt" ? els.exportScope.value : "all",
    });
  });

  els.mdInput.value = SAMPLE;
  render();
})();
