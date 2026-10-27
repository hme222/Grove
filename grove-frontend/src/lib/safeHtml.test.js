import { sanitizeLessonHtml } from './safeHtml';

describe('sanitizeLessonHtml', () => {
  test('keeps strong, em and br', () => {
    expect(sanitizeLessonHtml('Feel the <strong>soil</strong><br>then <em>wait</em>.')).toBe('Feel the <strong>soil</strong><br>then <em>wait</em>.');
  });

  test('decodes entities into text and escapes them back safely', () => {
    expect(sanitizeLessonHtml('North &amp; south &rsquo;s')).toBe('North &amp; south ’s');
  });

  test('drops scripts and styles with their contents', () => {
    expect(sanitizeLessonHtml('ok<script>alert(1)</script><style>p{}</style>!')).toBe('ok!');
  });

  test('removes attributes and event handlers', () => {
    expect(sanitizeLessonHtml('<strong onclick="x()" style="color:red">hi</strong>')).toBe('<strong>hi</strong>');
    expect(sanitizeLessonHtml('<img src=x onerror=alert(1)>text')).toBe('text');
  });

  test('turns other elements into their text and neutralizes links', () => {
    expect(sanitizeLessonHtml('<a href="javascript:alert(1)">tap</a> <div>here</div>')).toBe('tap here');
  });

  test('handles empty values', () => {
    expect(sanitizeLessonHtml(undefined)).toBe('');
    expect(sanitizeLessonHtml(null)).toBe('');
    expect(sanitizeLessonHtml('')).toBe('');
  });
});
