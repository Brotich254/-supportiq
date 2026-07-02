/**
 * SupportIQ Embed Script
 * Usage: <script src="https://supportiq.ai/embed.js" data-key="YOUR_API_KEY"></script>
 */
(function () {
  'use strict';

  const script = document.currentScript || document.querySelector('script[data-key]');
  const apiKey = script?.getAttribute('data-key');
  if (!apiKey) {
    console.warn('[SupportIQ] Missing data-key attribute.');
    return;
  }

  const BASE_URL = script.src.replace('/embed.js', '');
  const WIDGET_URL = `${BASE_URL}/widget?key=${encodeURIComponent(apiKey)}`;

  let isOpen = false;
  let iframe = null;
  let button = null;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #siq-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #6366f1;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(99,102,241,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #siq-button:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(99,102,241,0.6);
    }
    #siq-button svg { pointer-events: none; }
    #siq-iframe-container {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      height: 580px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 48px rgba(0,0,0,0.2);
      z-index: 999998;
      transition: opacity 0.2s ease, transform 0.2s ease;
      transform-origin: bottom right;
    }
    #siq-iframe-container.siq-hidden {
      opacity: 0;
      transform: scale(0.95);
      pointer-events: none;
    }
    #siq-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @media (max-width: 480px) {
      #siq-iframe-container {
        width: calc(100vw - 16px);
        height: calc(100vh - 100px);
        bottom: 84px;
        right: 8px;
        left: 8px;
      }
    }
  `;
  document.head.appendChild(style);

  // Create chat button
  button = document.createElement('button');
  button.id = 'siq-button';
  button.setAttribute('aria-label', 'Open support chat');
  button.innerHTML = `
    <svg id="siq-icon-chat" width="24" height="24" fill="white" viewBox="0 0 24 24">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
    </svg>
    <svg id="siq-icon-close" width="20" height="20" fill="white" viewBox="0 0 24 24" style="display:none">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
  `;

  // Create iframe container
  const container = document.createElement('div');
  container.id = 'siq-iframe-container';
  container.className = 'siq-hidden';

  iframe = document.createElement('iframe');
  iframe.id = 'siq-iframe';
  iframe.src = WIDGET_URL;
  iframe.setAttribute('title', 'Support Chat');
  iframe.setAttribute('allow', 'clipboard-write');

  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(button);

  // Toggle open/close
  function toggle() {
    isOpen = !isOpen;
    container.classList.toggle('siq-hidden', !isOpen);
    document.getElementById('siq-icon-chat').style.display = isOpen ? 'none' : 'block';
    document.getElementById('siq-icon-close').style.display = isOpen ? 'block' : 'none';
    button.setAttribute('aria-expanded', String(isOpen));
  }

  button.addEventListener('click', toggle);

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggle();
  });
})();
