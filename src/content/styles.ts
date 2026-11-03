/**
 * The banner's stylesheet. It lives inside a closed shadow root, so nothing
 * here can leak into Meet and none of Meet's styles can reach in.
 *
 * Colours are Meet's in-call dark palette (Google's Material grey and the
 * Material 3 dark tonal roles Meet uses for its own chips and toasts). The
 * fonts are the ones Meet already loads for the page; shadow roots share the
 * document's @font-face rules, so nothing is bundled.
 */
export const STYLES = /* css */ `
:host {
  all: initial;
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  pointer-events: none;

  --surface: #3c4043;
  --on-surface: #e8eaed;
  --on-surface-variant: #bdc1c6;
  --primary: #a8c7fa;
  --icon-bg: #004a77;
  --icon-fg: #c2e7ff;
  --chip-bg: rgba(232, 234, 237, 0.08);
  --chip-fg: #e8eaed;
  --urgent-bg: #8c1d18;
  --urgent-fg: #f9dedc;

  --ease-in: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-out: cubic-bezier(0.3, 0, 0.8, 0.15);
}

.card {
  pointer-events: auto;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  max-width: min(560px, calc(100vw - 32px));
  padding: 12px 8px 12px 12px;
  border-radius: 12px;
  background: var(--surface);
  color: var(--on-surface);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.3),
    0 4px 8px 3px rgba(0, 0, 0, 0.15);
  font-family: "Google Sans Text", "Google Sans", Roboto, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  animation: enter 300ms var(--ease-in) both;
}

.card.leaving {
  animation: leave 200ms var(--ease-out) both;
}

@keyframes enter {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: none; }
}
@keyframes leave {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-12px); }
}

.icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--icon-bg);
  color: var(--icon-fg);
  transition: background-color 300ms, color 300ms;
}
.icon svg { width: 24px; height: 24px; fill: currentColor; }

.text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.title {
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  letter-spacing: 0;
}
.detail {
  font-size: 14px;
  line-height: 20px;
  color: var(--on-surface-variant);
  letter-spacing: 0.2px;
}

.countdown {
  flex: none;
  min-width: 52px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--chip-bg);
  color: var(--chip-fg);
  font-family: "Google Sans", Roboto, Arial, sans-serif;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
  font-variant-numeric: tabular-nums;
  transition: background-color 300ms, color 300ms;
}
.countdown[hidden] { display: none; }

.close {
  flex: none;
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--on-surface);
  cursor: pointer;
  outline: none;
}
.close svg { width: 20px; height: 20px; fill: currentColor; }
/* Material state layer, the way Meet lights its own icon buttons. */
.close::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms;
}
.close:hover::before { opacity: 0.08; }
.close:active::before { opacity: 0.12; }
.close:focus-visible { box-shadow: inset 0 0 0 2px var(--primary); }

.card[data-tone="urgent"] .icon,
.card[data-tone="ended"] .icon,
.card[data-tone="urgent"] .countdown {
  background: var(--urgent-bg);
  color: var(--urgent-fg);
}
.card[data-tone="urgent"] .icon {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(242, 184, 181, 0.45); }
  50%      { box-shadow: 0 0 0 6px rgba(242, 184, 181, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .card, .card.leaving { animation-duration: 1ms; }
  .card[data-tone="urgent"] .icon { animation: none; }
}
`;
