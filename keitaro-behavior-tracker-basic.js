/*
 * Keitaro Landing Behavior Tracker — Basic Edition
 * For LOCAL Keitaro landing pages only.
 * Put this inline in index.html or index.php before </body>.
 *
 * Default sub IDs (change them in CONFIG.subs):
 * sub_id_15 — time in a visible tab, rounded down to the last checkpoint (seconds)
 * sub_id_16 — furthest HTML5 video position reached with sound, rounded down to videoStepSec
 * sub_id_17 — events joined with '-': play, sound (played unmuted), form (form visible)
 *
 * Uses Keitaro's built-in /?_update_tokens=1 endpoint.
 */
(() => {
  'use strict';

  const CONFIG = {
    // Keitaro sub IDs to write into: any free ones from sub_id_1 … sub_id_30.
    subs: {
      time: 'sub_id_15',
      video: 'sub_id_16',
      events: 'sub_id_17'
    },
    timeCheckpoints: [5, 15, 30, 60, 90, 120, 180, 240, 300, 450, 600, 900, 1200], // subs.time values
    videoStepSec: 15,             // subs.video rounding step (seconds)
    videoSelector: 'video',       // If there are several videos, use '#vsl-player'.
    formSelector: 'form',         // Prefer a specific selector if necessary.
    formVisibility: 0.2
  };

  // Keitaro replaces {subid} inside the local landing's index file.
  const subId = '{subid}';
  if (!subId || subId.includes('{') || subId.includes('}')) return;

  const storageKey = 'kt_behavior_basic_' + subId;
  const defaults = {
    visibleMs: 0,
    reportedTime: 0,
    maxVideo: 0,
    reportedVideo: -1,            // -1 = nothing reported yet; 0 is a valid bucket
    videoDuration: 0,
    flags: {}
  };

  let state = { ...defaults };
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    if (stored && typeof stored === 'object') state = { ...defaults, ...stored };
  } catch (_) {}
  if (!state.flags || typeof state.flags !== 'object') state.flags = {};

  function save() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) {}
  }

  const pad = (n, width = 4) => String(Math.floor(n)).padStart(width, '0');
  // subs.events values, always in this order, e.g. 'play-sound-form'.
  const FLAG_ORDER = ['play', 'sound', 'form'];
  const flagsValue = () => FLAG_ORDER.filter(k => state.flags[k]).join('-');

  // Send the latest known state, not a history of individual events.
  function snapshot() {
    const data = {};
    if (state.reportedTime > 0) data[CONFIG.subs.time] = pad(state.reportedTime);
    if (state.reportedVideo >= 0 && state.videoDuration > 0) {
      const pct = Math.min(100, Math.floor(100 * state.reportedVideo / state.videoDuration));
      data[CONFIG.subs.video] = `${pad(state.reportedVideo)}/${pad(state.videoDuration)} (${pad(pct, 3)}%)`;
    }
    const flags = flagsValue();
    if (flags) data[CONFIG.subs.events] = flags;
    return data;
  }

  function urlFor(data) {
    return '/?' + new URLSearchParams({
      ...data,
      _update_tokens: '1',
      sub_id: subId
    }).toString();
  }

  let dirty = false;
  let sending = false;
  let timer = null;
  let retried = false;

  function schedule(delay = 250) {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, delay);
  }

  function queue(delay = 250) {
    dirty = true;
    schedule(delay);
  }

  // Ordinary requests run sequentially. One retry after a network/HTTP error.
  async function flush() {
    if (sending || !dirty) return;
    const data = snapshot();
    if (!Object.keys(data).length) { dirty = false; return; }

    dirty = false;
    sending = true;
    try {
      const response = await fetch(urlFor(data), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        keepalive: true
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      retried = false;
    } catch (error) {
      dirty = true;
      if (!retried) {
        retried = true;
        schedule(1000);
      } else {
        console.warn('[Keitaro Behavior] Update failed:', error);
      }
    } finally {
      sending = false;
      if (dirty && timer === null && !retried) schedule(0);
    }
  }

  function flag(code) {
    if (state.flags[code]) return;
    state.flags[code] = true;
    save();
    queue();
  }

  // Counts time while this browser tab is visible (not proof of attention).
  let visibleSince = document.hidden ? null : performance.now();

  function reportTime(final = false) {
    if (visibleSince !== null) {
      const now = performance.now();
      state.visibleMs += Math.max(0, now - visibleSince);
      visibleSince = now;
    }
    const seconds = Math.floor(state.visibleMs / 1000);
    // Only checkpoint values (5, 15, 30...) are sent, so Keitaro reports group cleanly.
    const bucket = CONFIG.timeCheckpoints.reduce(
      (best, mark) => (seconds >= mark && mark > best ? mark : best), 0
    );
    if (bucket > state.reportedTime) {
      state.reportedTime = bucket;
      if (!final) queue();
    }
    save();
  }

  setInterval(() => {
    if (!document.hidden) reportTime();
  }, 1000);

  // The first matching native HTML5 video is treated as the VSL.
  let video = null;
  let wasAudible = false;

  // Position rounded down to videoStepSec; the full duration means "reached the end".
  function videoBucket() {
    const duration = state.videoDuration;
    const step = Math.max(1, CONFIG.videoStepSec);
    const position = Math.min(state.maxVideo, duration);
    if (position >= duration - 1) return duration;
    return Math.floor(position / step) * step;
  }

  function reportVideo(force = false, final = false) {
    if (!video) return;

    const audible = !video.paused && !video.muted && video.volume > 0;
    if (audible) flag('sound');

    const position = Math.floor(video.currentTime);
    if ((audible || (force && wasAudible)) &&
        Number.isFinite(position) && position >= 0) {
      state.maxVideo = Math.max(state.maxVideo, position);
    }
    wasAudible = audible;

    if (Number.isFinite(video.duration) && video.duration > 0) {
      state.videoDuration = Math.floor(video.duration);
    }
    if (state.flags.sound && state.videoDuration > 0) {
      const bucket = videoBucket();
      if (bucket > state.reportedVideo) {
        state.reportedVideo = bucket;
        if (!final) queue(force ? 0 : 250);
      }
    }
    save();
  }

  function bindVideo() {
    if (video) return;
    const found = document.querySelector(CONFIG.videoSelector);
    if (!found) return;
    video = found;

    video.addEventListener('play', () => {
      flag('play');
      reportVideo();
    });
    video.addEventListener('volumechange', () => reportVideo(true));
    video.addEventListener('timeupdate', () => reportVideo());
    video.addEventListener('pause', () => reportVideo(true));
    video.addEventListener('ended', () => reportVideo(true));
    video.addEventListener('loadedmetadata', () => reportVideo());

    if (!video.paused) {
      flag('play');
      reportVideo();
    }
  }

  // Form appearance in the viewport, NOT form submission.
  const observedForms = new WeakSet();
  const formObserver = new IntersectionObserver(entries => {
    if (entries.some(entry =>
      entry.isIntersecting && entry.intersectionRatio >= CONFIG.formVisibility
    )) {
      flag('form');
      formObserver.disconnect();
    }
  }, { threshold: CONFIG.formVisibility });

  function bindForms() {
    if (state.flags.form) return;
    document.querySelectorAll(CONFIG.formSelector).forEach(form => {
      if (!observedForms.has(form)) {
        observedForms.add(form);
        formObserver.observe(form);
      }
    });
  }

  function scan() { bindVideo(); bindForms(); }
  function startScan() {
    scan();
    const domObserver = new MutationObserver(() => {
      scan();
      if (video && state.flags.form) domObserver.disconnect();
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }
  // document.body is null if the snippet is pasted into <head>.
  if (document.body) startScan();
  else document.addEventListener('DOMContentLoaded', startScan);

  // Best-effort final snapshot; bypasses an in-flight ordinary request.
  // Browser keepalive cannot guarantee arrival or request ordering.
  let lastExitPayload = '';
  function finalize() {
    reportTime(true);
    reportVideo(true, true);
    save();

    if (timer !== null) clearTimeout(timer);
    timer = null;
    dirty = false;

    const data = snapshot();
    const key = JSON.stringify(data);
    if (!Object.keys(data).length || key === lastExitPayload) return;
    lastExitPayload = key;

    void fetch(urlFor(data), {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive: true
    }).catch(() => {});
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      finalize();
      visibleSince = null;
    } else {
      visibleSince = performance.now();
      lastExitPayload = '';
    }
  });

  window.addEventListener('pagehide', () => {
    finalize();
    visibleSince = null;
  });
})();
