/**
 * Markup — Circle objects in images with Gemini
 * Light theme, image in chat, red circles (no fill)
 */

const API_KEY_STORAGE = 'markup_gemini_api_key';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const CIRCLE_STROKE = '#dc3545';

// State
let circles = [];
let sourceImage = null;
let imageNaturalWidth = 0;
let imageNaturalHeight = 0;

// DOM elements
const uploadZone = document.getElementById('uploadZone');
const imageMessage = document.getElementById('imageMessage');
const imageWrapper = document.getElementById('imageWrapper');
const sourceImg = document.getElementById('sourceImage');
const markupCanvas = document.getElementById('markupCanvas');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatTitle = document.getElementById('chatTitle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const newChatBtn = document.getElementById('newChatBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const toast = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
  loadApiKey();
  setupImageUpload();
  setupCanvas();
  setupChat();
  setupSettings();
  setupNewChat();
  setupAttach();
});

function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE);
}

function loadApiKey() {
  const key = getApiKey();
  if (key) apiKeyInput.value = key;
}

function setupImageUpload() {
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) loadImage(file);
  });
}

function setupAttach() {
  attachBtn.addEventListener('click', () => fileInput.click());
}

function loadImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    sourceImg.onload = () => {
      imageNaturalWidth = sourceImg.naturalWidth;
      imageNaturalHeight = sourceImg.naturalHeight;
      sourceImage = e.target.result;
      circles = [];

      uploadZone.style.display = 'none';
      imageMessage.style.display = 'block';

      chatTitle.textContent = file.name;
      sendBtn.disabled = false;

      resizeCanvas();
      drawCircles();
    };
    sourceImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function setupCanvas() {
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(imageWrapper);

  imageWrapper.addEventListener('click', handleImageClick);

  document.getElementById('exportBtn').addEventListener('click', exportMarkedImage);
  document.getElementById('clearCirclesBtn').addEventListener('click', () => {
    circles = [];
    drawCircles();
    showToast('Circles cleared', 'success');
  });
}

function handleImageClick(e) {
  if (!sourceImg.complete || !sourceImg.naturalWidth) return;
  const imgRect = sourceImg.getBoundingClientRect();
  const scaleX = imageNaturalWidth / imgRect.width;
  const scaleY = imageNaturalHeight / imgRect.height;

  const relX = e.clientX - imgRect.left;
  const relY = e.clientY - imgRect.top;
  if (relX < 0 || relY < 0 || relX > imgRect.width || relY > imgRect.height) return;

  const x = Math.round(relX * scaleX);
  const y = Math.round(relY * scaleY);

  addMark(x, y, 40, 40);
}

function addMark(x, y, radiusX, radiusY = radiusX, label = '', certainty = null) {
  circles.push({ x, y, radiusX, radiusY, label, certainty });
  drawCircles();
}

function resizeCanvas() {
  if (!sourceImg.complete || !sourceImg.naturalWidth) return;

  const imgRect = sourceImg.getBoundingClientRect();
  const wrapperRect = imageWrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  markupCanvas.width = imgRect.width * dpr;
  markupCanvas.height = imgRect.height * dpr;
  markupCanvas.style.width = imgRect.width + 'px';
  markupCanvas.style.height = imgRect.height + 'px';
  markupCanvas.style.left = (imgRect.left - wrapperRect.left) + 'px';
  markupCanvas.style.top = (imgRect.top - wrapperRect.top) + 'px';

  const ctx = markupCanvas.getContext('2d');
  ctx.scale(dpr, dpr);

  drawCircles();
}

function drawCircles() {
  const ctx = markupCanvas.getContext('2d');
  const imgRect = sourceImg.getBoundingClientRect();
  const scaleX = imgRect.width / imageNaturalWidth;
  const scaleY = imgRect.height / imageNaturalHeight;

  ctx.clearRect(0, 0, imgRect.width, imgRect.height);

  circles.forEach((c) => {
    const x = c.x * scaleX;
    const y = c.y * scaleY;
    const rx = (c.radiusX ?? c.radius) * scaleX;
    const ry = (c.radiusY ?? c.radius ?? c.radiusX) * scaleY;

    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = CIRCLE_STROKE;
    ctx.lineWidth = 3;
    ctx.stroke();

    const labelText = [c.label, c.certainty != null ? `${Math.round(c.certainty)}%` : ''].filter(Boolean).join(' ');
    if (labelText) {
      ctx.font = '14px DM Sans, sans-serif';
      ctx.fillStyle = CIRCLE_STROKE;
      const maxR = Math.max(rx, ry);
      ctx.fillText(labelText, x + maxR + 6, y + 4);
    }
  });
}

function bboxToEllipse(bbox, imgW, imgH) {
  const [ymin, xmin, ymax, xmax] = bbox.map((v) => v / 1000);
  const x = ((xmin + xmax) / 2) * imgW;
  const y = ((ymin + ymax) / 2) * imgH;
  const w = (xmax - xmin) * imgW;
  const h = (ymax - ymin) * imgH;
  const radiusX = w / 2;
  const radiusY = h / 2;
  return { x: Math.round(x), y: Math.round(y), radiusX: Math.round(radiusX), radiusY: Math.round(radiusY) };
}

function parseGeminiResponse(text, imgW, imgH) {
  const parsed = [];
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return parsed;

  try {
    const data = JSON.parse(jsonMatch[0]);
    const items = data.objects || data.circles || data.regions || [];
    items.forEach((item) => {
      const bbox = item.bbox || item.bounding_box;
      if (Array.isArray(bbox) && bbox.length >= 4) {
        const ellipse = bboxToEllipse(bbox, imgW, imgH);
        const certainty = item.certainty ?? item.confidence ?? item.score;
        const cert = certainty != null
          ? (typeof certainty === 'number' && certainty <= 1 ? certainty * 100 : certainty)
          : null;
        parsed.push({
          ...ellipse,
          label: item.label || item.name || '',
          certainty: cert,
        });
      }
    });
  } catch (_) {}

  return parsed;
}

function setupChat() {
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  if (!getApiKey()) {
    showToast('Please add your Gemini API key in settings', 'error');
    settingsModal.classList.add('visible');
    return;
  }

  if (!sourceImage) {
    showToast('Please upload an image first', 'error');
    return;
  }

  addMessage('user', text);
  messageInput.value = '';
  messageInput.style.height = 'auto';

  const loadingEl = addLoadingMessage();
  sendBtn.disabled = true;

  try {
    const base64 = sourceImage.split(',')[1];
    const mimeType = sourceImage.match(/data:([^;]+)/)?.[1] || 'image/jpeg';

    const contents = [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
          {
            text: `You are helping to mark up an image by circling objects. The user wants: "${text}"

Identify the requested objects in this image. Return ONLY a JSON object with this exact format (no other text):
{
  "objects": [
    {"label": "object name", "bbox": [ymin, xmin, ymax, xmax], "certainty": 0.0-1.0}
  ]
}

Use normalized coordinates 0-1000 for bbox (ymin, xmin, ymax, xmax). The bbox can be oblong—use the actual bounds of each object for ellipses. Include "certainty" as a number 0-1 for how confident you are this is the right object (e.g. 0.92 for 92% confident). Include all relevant objects the user asked for.`,
          },
        ],
      },
    ];

    const response = await fetch(
      `${GEMINI_API_URL}?key=${getApiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const outputText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const newCircles = parseGeminiResponse(
      outputText,
      imageNaturalWidth,
      imageNaturalHeight
    );

    if (newCircles.length > 0) {
      circles.push(...newCircles);
      resizeCanvas();
      drawCircles();
      addMessage(
        'assistant',
        `I've drawn ${newCircles.length} circle(s) around the object(s) you specified.`
      );
    } else {
      addMessage(
        'assistant',
        "I couldn't parse object locations from my response. Try being more specific, or click on the image to add circles manually."
      );
    }
  } catch (err) {
    addMessage('assistant', `Error: ${err.message}`, true);
    showToast(err.message, 'error');
  } finally {
    loadingEl.remove();
    sendBtn.disabled = false;
  }
}

function addMessage(role, text, isError = false) {
  const el = document.createElement('div');
  el.className = `message ${role}${isError ? ' error' : ''}`;
  el.innerHTML = `
    <div class="message-avatar">${role === 'user' ? '' : '◆'}</div>
    <div class="message-content">
      <div class="message-text">${escapeHtml(text)}</div>
    </div>
  `;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function addLoadingMessage() {
  const el = document.createElement('div');
  el.className = 'message assistant';
  el.innerHTML = `
    <div class="message-avatar">◆</div>
    <div class="message-content">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function setupSettings() {
  settingsBtn.addEventListener('click', () => settingsModal.classList.add('visible'));
  cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('visible'));
  saveSettingsBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key);
      showToast('API key saved', 'success');
      settingsModal.classList.remove('visible');
    }
  });
}

function setupNewChat() {
  newChatBtn.addEventListener('click', () => {
    circles = [];
    sourceImage = null;
    uploadZone.style.display = 'flex';
    imageMessage.style.display = 'none';
    Array.from(messagesEl.querySelectorAll('.message')).forEach((m) => m.remove());
    chatTitle.textContent = 'Upload an image to get started';
    sendBtn.disabled = true;
    sourceImg.src = '';
  });
}

function exportMarkedImage() {
  if (!sourceImage) {
    showToast('Upload an image first', 'error');
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = imageNaturalWidth;
  canvas.height = imageNaturalHeight;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    circles.forEach((c) => {
      const rx = c.radiusX ?? c.radius ?? 40;
      const ry = c.radiusY ?? c.radius ?? 40;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = CIRCLE_STROKE;
      ctx.lineWidth = Math.max(2, imageNaturalWidth / 400);
      ctx.stroke();
      const labelText = [c.label, c.certainty != null ? `${Math.round(c.certainty)}%` : ''].filter(Boolean).join(' ');
      if (labelText) {
        ctx.font = `${Math.max(12, imageNaturalWidth / 50)}px sans-serif`;
        ctx.fillStyle = CIRCLE_STROKE;
        ctx.fillText(labelText, c.x + Math.max(rx, ry) + 8, c.y + 4);
      }
    });
    const a = document.createElement('a');
    a.download = 'marked-image.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Image downloaded', 'success');
  };
  img.src = sourceImage;
}

function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = `toast visible ${type}`;
  setTimeout(() => toast.classList.remove('visible'), 3000);
}
