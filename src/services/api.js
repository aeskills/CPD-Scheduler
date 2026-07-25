const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyUTaKgdOHXTShNzOHMhIXWaop8J-yiwbDPg677S9wEGpDUSs9zm5NRQE6wlUAcz5kK/exec';

export function getAppScriptUrl() {
  return localStorage.getItem('cpd_scheduler_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
}

export function setAppScriptUrl(url) {
  if (url) {
    localStorage.setItem('cpd_scheduler_apps_script_url', url);
  } else {
    localStorage.removeItem('cpd_scheduler_apps_script_url');
  }
}

export async function fetchAdminDataFromBackend() {
  const url = getAppScriptUrl();
  if (!url.trim()) return null;

  try {
    const response = await fetch(url + '?action=getAdminData', { method: 'GET' });
    if (response.ok) {
      const result = await response.json();
      if (result && result.status === 'success') {
        return result;
      }
    }
  } catch (err) {
    console.warn('Backend fetch note:', err);
  }
  return null;
}

export async function postToBackend(payload) {
  const url = getAppScriptUrl();
  if (!url.trim()) return false;

  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Backend POST note:', err);
    return false;
  }
}

// BroadcastChannel Instant Sync Helper
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && window.BroadcastChannel) {
    syncChannel = new BroadcastChannel('cpd_live_sync');
  }
} catch (e) {}

export function broadcastLiveSync(data) {
  if (syncChannel) {
    try {
      syncChannel.postMessage(data);
    } catch (e) {}
  }
}

export function subscribeLiveSync(callback) {
  if (syncChannel) {
    const handler = (e) => callback(e.data);
    syncChannel.addEventListener('message', handler);
    return () => syncChannel.removeEventListener('message', handler);
  }
  return () => {};
}
