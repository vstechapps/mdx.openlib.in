(function (global) {
  const imageUrls = new Map();
  const objectUrls = [];

  function revokeObjectUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.length = 0;
    imageUrls.clear();
  }

  function normalizePath(path) {
    return String(path || "")
      .trim()
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^\/+/, "")
      .toLowerCase();
  }

  function isImageFile(file) {
    if (file.type && file.type.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(file.name);
  }

  function registerFolderFiles(fileList) {
    revokeObjectUrls();
    const files = Array.from(fileList || []);
    let imageCount = 0;

    files.forEach((file) => {
      if (!isImageFile(file)) return;
      const url = URL.createObjectURL(file);
      objectUrls.push(url);
      imageCount += 1;

      const rel = normalizePath(file.webkitRelativePath || file.name);
      imageUrls.set(rel, url);
      imageUrls.set(file.name.toLowerCase(), url);

      const parts = rel.split("/");
      for (let i = 1; i < parts.length; i += 1) {
        imageUrls.set(parts.slice(i).join("/"), url);
      }
    });

    return { imageCount, fileCount: files.length };
  }

  function resolveImageSrc(src) {
    const raw = String(src || "")
      .trim()
      .replace(/^<|>$/g, "")
      .replace(/^['"]|['"]$/g, "");
    if (!raw || /^(https?:|data:|blob:)/i.test(raw)) return raw;

    const clean = normalizePath(raw.split("?")[0].split("#")[0]);
    if (imageUrls.has(clean)) return imageUrls.get(clean);

    const name = clean.split("/").pop();
    if (name && imageUrls.has(name)) return imageUrls.get(name);
    return raw;
  }

  function rewriteMarkdownImages(markdown) {
    return String(markdown || "").replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (full, alt, src) => {
      const resolved = resolveImageSrc(src);
      return `![${alt}](${resolved})`;
    });
  }

  function splitSlides(markdown) {
    const text = String(markdown || "").replace(/\r\n/g, "\n").trim();
    if (!text) return [""];

    const byRule = text.split(/^\s*---\s*$/m).map((part) => part.trim());
    if (byRule.length > 1) return byRule.filter((part) => part.length > 0);

    const headingSplit = text.split(/^(?=#[^#])/m).filter((part) => part.trim());
    return headingSplit.length ? headingSplit : [text];
  }

  function renderHtml(markdown) {
    const prepared = rewriteMarkdownImages(markdown);
    const html = global.marked.parse(prepared, { gfm: true, breaks: false });
    return global.DOMPurify.sanitize(html, { ADD_TAGS: ["img"], ADD_ATTR: ["src", "alt", "title"] });
  }

  function renderPreview(markdown, mode) {
    if (mode !== "ppt") return renderHtml(markdown);

    return splitSlides(markdown)
      .map((slide, index) => `<section class="slide${index === 0 ? " is-active" : ""}" data-slide="${index}">${renderHtml(slide)}</section>`)
      .join("");
  }

  global.MDXMarkdown = {
    registerFolderFiles,
    renderPreview,
    splitSlides,
    imageCount: () => imageUrls.size,
  };
})(window);
