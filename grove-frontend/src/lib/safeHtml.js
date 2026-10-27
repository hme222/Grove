// Lesson card text is written as simple HTML (<strong>, <em>, <br>). It comes from our own lesson files today, but
// anything rendered with dangerouslySetInnerHTML goes through here so a future API-sourced card cannot inject markup.
// Allowed: strong, em, b, i, br, with no attributes. Script and style are dropped with their contents; any other
// element is replaced by its text. Everything is re-serialized from the parsed tree, so the output is always well formed.
const ALLOWED = new Set(['STRONG', 'EM', 'B', 'I', 'BR']);
const DROPPED = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE']);

const escapeText = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function serialize(node) {
  if (node.nodeType === 3) return escapeText(node.nodeValue || '');
  if (node.nodeType !== 1) return '';
  if (DROPPED.has(node.tagName)) return '';
  const inner = Array.from(node.childNodes).map(serialize).join('');
  if (!ALLOWED.has(node.tagName)) return inner;
  const tag = node.tagName.toLowerCase();
  return tag === 'br' ? '<br>' : `<${tag}>${inner}</${tag}>`;
}

export function sanitizeLessonHtml(html) {
  if (html === null || html === undefined) return '';
  const source = String(html);
  if (typeof DOMParser === 'undefined') return escapeText(source);
  const doc = new DOMParser().parseFromString(`<body>${source}</body>`, 'text/html');
  return Array.from(doc.body.childNodes).map(serialize).join('');
}
