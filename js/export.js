(function (global) {
  let exportCleanupTimer;

  function clearExportState() {
    document.body.classList.remove("export-pdf", "export-ppt", "export-current");
  }

  function exportPreview({ mode, scope }) {
    window.clearTimeout(exportCleanupTimer);
    clearExportState();
    document.body.classList.add(mode === "ppt" ? "export-ppt" : "export-pdf");
    document.body.classList.toggle("export-ppt", mode === "ppt");
    document.body.classList.toggle("export-current", mode === "ppt" && scope === "current");
    window.print();
    exportCleanupTimer = window.setTimeout(clearExportState, 1000);
  }

  window.addEventListener("afterprint", clearExportState);

  global.MDXExport = { exportPreview };
})(window);
