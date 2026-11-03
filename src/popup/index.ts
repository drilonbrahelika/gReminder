/**
 * The toolbar popup: one choice, saved as soon as it is picked. Open Meet
 * tabs pick the change up through chrome.storage.onChanged.
 */
import { chromeStorage, LEAD_KEY, loadLeadMinutes } from '../shared/settings.ts';

const storage = chromeStorage();
const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="lead"]')];

if (storage) {
  void loadLeadMinutes(storage).then((minutes) => {
    for (const r of radios) r.checked = Number(r.value) === minutes;
  });
  for (const r of radios) {
    r.addEventListener('change', () => {
      if (r.checked) void storage.storage.sync.set({ [LEAD_KEY]: Number(r.value) });
    });
  }
}
