// src/registerSW.js
// Registers /sw.js in production and handles update notifications

function showUpdateToast(registration) {
  // Prevent duplicate toasts
  if (document.getElementById('sw-update-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '99999';
  toast.style.backgroundColor = '#161b22';
  toast.style.color = '#f0f6fc';
  toast.style.border = '1px solid #30363d';
  toast.style.borderRadius = '12px';
  toast.style.padding = '12px 18px';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.fontFamily = "'Poppins', system-ui, -apple-system, sans-serif";
  toast.style.fontSize = '14px';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(12px)';
  toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
      </svg>
      <span>New version available.</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;">
      <button id="sw-refresh-btn" style="
        background: linear-gradient(135deg, #9333ea, #7c3aed);
        color: white;
        border: none;
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: 500;
        font-size: 13px;
        cursor: pointer;
        transition: opacity 0.15s ease;
      ">Refresh</button>
      <button id="sw-dismiss-btn" aria-label="Dismiss" style="
        background: transparent;
        color: #8b949e;
        border: none;
        padding: 4px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(toast);

  // Trigger smooth entrance animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  const refreshBtn = toast.querySelector('#sw-refresh-btn');
  const dismissBtn = toast.querySelector('#sw-dismiss-btn');

  refreshBtn?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    toast.remove();
  });

  dismissBtn?.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 250);
  });
}

export function register() {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // If a new worker is already waiting (e.g. from previous load)
          if (registration.waiting) {
            showUpdateToast(registration);
            return;
          }

          // Listen for new updates found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              // Only notify if there is an existing active controller (i.e. this is an update, not first install)
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(registration);
              }
            });
          });
        })
        .catch((error) => {
          console.error('[SW] Service worker registration failed:', error);
        });
    });
  }
}
