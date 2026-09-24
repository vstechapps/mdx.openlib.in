(function (global) {
  function exportPreview({ mode, scope }) {
    document.body.classList.toggle("export-ppt", mode === "ppt");
    document.body.classList.toggle("export-current", mode === "ppt" && scope === "current");
    window.print();
    window.setTimeout(() => {
      document.body.classList.remove("export-ppt", "export-current");
    }, 300);
  }

  global.MDXExport = { exportPreview };
})(window);
