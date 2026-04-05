# Markup — Circle objects in images with Gemini

A chat-style web app that lets you upload an image, describe which objects to circle, and have Gemini draw circles around them. You can also add circles manually by clicking on the image.

## Features

- **Chat interface** — Gemini/ChatGPT-style UI
- **Image upload** — Drag & drop or click to upload (PNG, JPG, WebP)
- **Gemini Vision** — Ask in natural language (e.g. "circle the dog", "mark all red cars") and Gemini detects objects and draws circles
- **Manual circles** — Click anywhere on the image to add a circle
- **Export** — Download the marked-up image with circles
- **Clear** — Remove all circles and start over

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `index.html` in a browser (or use a local server)
3. Click **API settings** and enter your key (stored in `localStorage`)

## Usage

1. Upload an image
2. Type what to circle in the chat (e.g. "circle the person's face", "mark the coffee cup")
3. Gemini will detect objects and draw circles
4. Click on the image to add circles manually if needed
5. Use **Download marked image** to save the result

## Files

- `index.html` — Structure and UI
- `styles.css` — Layout and styling
- `app.js` — Image handling, canvas drawing, Gemini API calls
