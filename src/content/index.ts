/**
 * Isolated-world content script. Shows the reminder banner; reads the end
 * time from the page script's message or from text Meet already renders.
 * The only extension API it uses is chrome.storage, for the lead time.
 */
import { Controller, TICK_MS } from './controller.ts';
import { chromeStorage, loadLeadMinutes, onLeadMinutesChange } from '../shared/settings.ts';

const controller = new Controller(window);

window.addEventListener('message', (event) => controller.onMessage(event));
controller.tick();
setInterval(() => controller.tick(), TICK_MS);

const storage = chromeStorage();
if (storage) {
  // A change seen while the first read is pending is newer than that read.
  let changed = false;
  onLeadMinutesChange(storage, (minutes) => {
    changed = true;
    controller.setLeadMinutes(minutes);
  });
  void loadLeadMinutes(storage).then((minutes) => {
    if (!changed) controller.setLeadMinutes(minutes);
  });
}

// Debugging aid: switch the DevTools console to this extension's context and
// run `greminder()` to see what was detected.
Object.assign(globalThis, { greminder: () => controller.status() });
