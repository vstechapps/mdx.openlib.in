(function (global) {
  let exportCleanupTimer;
  let originalDocumentTitle;

  function clearExportState() {
    document.body.classList.remove("export-pdf", "export-ppt", "export-current");
    if (originalDocumentTitle !== undefined) {
      document.title = originalDocumentTitle;
      originalDocumentTitle = undefined;
    }
  }

  function exportPreview({ mode, scope }) {
    window.clearTimeout(exportCleanupTimer);
    clearExportState();
    document.body.classList.add(mode === "ppt" ? "export-ppt" : "export-pdf");
    document.body.classList.toggle("export-ppt", mode === "ppt");
    document.body.classList.toggle("export-current", mode === "ppt" && scope === "current");
    const date = new Date();
    const dateStamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    originalDocumentTitle = document.title;
    document.title = `mdx-${mode}-${dateStamp}`;
    try {
      window.print();
    } catch (error) {
      clearExportState();
      throw error;
    }
    exportCleanupTimer = window.setTimeout(clearExportState, 1000);
  }

  window.addEventListener("afterprint", clearExportState);

  global.MDX = Object.assign(global.MDX || {}, { exportPreview });
})(window);