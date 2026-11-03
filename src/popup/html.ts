/**
 * The popup's markup and styles, written out as dist/popup.html by the build.
 * Styled after Meet's own settings dialog: Google Sans, Material 3 radio rows,
 * light and dark to follow the browser.
 */
import { LEAD_CHOICES } from '../shared/settings.ts';

const options = LEAD_CHOICES.map(
  (m) => /* html */ `
      <label class="row">
        <input type="radio" name="lead" value="${m}">
        <span class="radio" aria-hidden="true"></span>
        <span>${m} minutes before the end</span>
      </label>`,
).join('');

const STYLES = /* css */ `
:root {
  color-scheme: light dark;
  --surface: #fff;
  --on-surface: #1f1f1f;
  --on-surface-variant: #444746;
  --primary: #0b57d0;
  --hover: rgba(31, 31, 31, 0.08);
  --outline: #747775;
}
@media (prefers-color-scheme: dark) {
  :root {
    --surface: #202124;
    --on-surface: #e3e3e3;
    --on-surface-variant: #c4c7c5;
    --primary: #a8c7fa;
    --hover: rgba(227, 227, 227, 0.08);
    --outline: #8e918f;
  }
}
body {
  margin: 0;
  width: 300px;
  background: var(--surface);
  color: var(--on-surface);
  font: 14px/20px "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px 8px;
}
header img { width: 28px; height: 28px; }
h1 {
  margin: 0;
  font: 400 18px/24px "Google Sans", Roboto, Arial, sans-serif;
}
p {
  margin: 0;
  padding: 4px 20px 8px;
  color: var(--on-surface-variant);
}
fieldset { margin: 0; padding: 0 0 12px; border: 0; }
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 44px;
  padding: 0 20px;
  cursor: pointer;
}
.row:hover { background: var(--hover); }
.row input { position: absolute; opacity: 0; pointer-events: none; }
.radio {
  box-sizing: border-box;
  flex: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--outline);
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.radio::after {
  content: "";
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
  transform: scale(0);
  transition: transform 150ms cubic-bezier(0.2, 0, 0, 1);
}
.row input:checked + .radio { border-color: var(--primary); }
.row input:checked + .radio::after { transform: scale(1); }
.row input:focus-visible + .radio { outline: 2px solid var(--primary); outline-offset: 3px; }
`;

export const POPUP_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>gReminder</title>
  <style>${STYLES}</style>
</head>
<body>
  <header>
    <img src="icons/icon48.png" alt="">
    <h1>gReminder</h1>
  </header>
  <p>When should the Meet banner appear?</p>
  <form>
    <fieldset>
      <legend hidden>Reminder time</legend>${options}
    </fieldset>
  </form>
  <script src="popup.js"></script>
</body>
</html>
`;
