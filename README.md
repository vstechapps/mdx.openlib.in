# mdx.openlib.in
Mark Down Extender For Presentation and PPT

Getting started guide: [getting-started/index.html](getting-started/index.html).

## MDX JS bundle

`js/mdx.min.js` is a standalone browser bundle containing Marked 15.0.7,
DOMPurify 3.2.5, the Markdown renderer, and the preview export helper. Load it
with a script tag; it exposes `window.MDX`:

```html
<script src="https://mdx.openlib.in/js/mdx.min.js" defer></script>
<script>
	document.addEventListener("DOMContentLoaded", () => {
		const html = MDX.renderPreview("# Hello", "pdf", "warm");
		document.querySelector("#preview").innerHTML = html;
	});
</script>
```

The optional theme is `classic`, `executive`, `warm`, or `dark`. Include
`css/mdx.theme.css` to apply those theme styles. Include
`css/mdx-app-ui.css` for the MDX app interface and preview layout. The renderer
also works without a theme parameter, returning only the rendered content.
`MDX.exportPreview({ mode: "pdf", scope: "all" })` prints an MDX preview using
the browser's print dialog.

The editable sources are `src/markdown.js` and `src/export.js`; their pinned
dependencies are `src/marked.min.js` and `src/purify.min.js`. To regenerate the
browser bundle after changing a source file, run:

```sh
npx --yes terser src/marked.min.js src/purify.min.js src/markdown.js src/export.js --compress --mangle --output js/mdx.min.js
```
