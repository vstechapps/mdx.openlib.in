# mdx.openlib.in
Mark Down Extender For Presentation and PPT

## Markdown renderer bundle

`js/markdown.min.js` is a standalone browser bundle containing Marked 15.0.7,
DOMPurify 3.2.5, and the MDXMarkdown renderer. Load it with a script tag; it
exposes `window.MDXMarkdown`:

```html
<script src="https://cdn.jsdelivr.net/gh/OWNER/REPO@VERSION/js/markdown.min.js"></script>
<script>
	const html = MDXMarkdown.renderPreview("# Hello", "pdf", "warm");
</script>
```

The optional theme is `classic`, `executive`, `warm`, or `dark`. Include
`css/markdown-preview-themes.css` to apply those theme styles. Include
`css/mdx-app-ui.css` for the MDX app interface and preview layout. The renderer
also works without a theme parameter, returning only the rendered content.

The editable renderer source is `src/markdown.js`; its pinned dependencies are
`src/marked.min.js` and `src/purify.min.js`. To regenerate the browser bundle
after changing a source file, run:

```sh
npx --yes terser src/marked.min.js src/purify.min.js src/markdown.js --compress --mangle --output js/markdown.min.js
```
