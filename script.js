// ===== CONFIG =====
const API_URL = "https://YOUR_VERCEL_URL_HERE/api/discord-images";

// ===== ELEMENTS =====
const messageInput = document.getElementById("messageUrl");
const fetchBtn = document.getElementById("fetchBtn");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("attachmentsList");
const copyAllBtn = document.getElementById("copyAllBtn");
const toastEl = document.getElementById("toast");

let currentUrls = [];

// ===== Helpers =====
function setStatus(text, isError = false) {
  statusEl.textContent = text || "";
  statusEl.style.color = isError ? "#ffb3b3" : "#cccccc";
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1600);
}

function renderAttachments(urlsWithMeta) {
  listEl.innerHTML = "";

  if (!urlsWithMeta.length) {
    const p = document.createElement("p");
    p.textContent = "No image attachments found for that message.";
    p.className = "placeholder";
    listEl.appendChild(p);
    copyAllBtn.disabled = true;
    return;
  }

  urlsWithMeta.forEach((att, index) => {
    const item = document.createElement("div");
    item.className = "attachment-item";

    const img = document.createElement("img");
    img.className = "attachment-thumb";
    img.src = att.url;
    img.alt = att.filename || `Image ${index + 1}`;

    const label = document.createElement("div");
    label.className = "attachment-label";
    label.textContent = att.filename || att.url;

    const idx = document.createElement("div");
    idx.className = "attachment-index";
    idx.textContent = index + 1;

    item.appendChild(img);
    item.appendChild(label);
    item.appendChild(idx);

    item.addEventListener("click", () => {
      navigator.clipboard
        .writeText(att.url)
        .then(() => showToast("Image URL copied"))
        .catch(() => showToast("Failed to copy"));
    });

    listEl.appendChild(item);
  });

  copyAllBtn.disabled = false;
}

// ===== Events =====
fetchBtn.addEventListener("click", async () => {
  const url = messageInput.value.trim();
  if (!url) {
    setStatus("Paste a Discord message link first.", true);
    return;
  }

  setStatus("Fetching from Discord...");
  fetchBtn.disabled = true;
  copyAllBtn.disabled = true;
  listEl.innerHTML =
    '<p class="placeholder">Loading attachments...</p>';

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageUrl: url })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data);
      setStatus(
        data.error || "Something went wrong while calling the API.",
        true
      );
      listEl.innerHTML =
        '<p class="placeholder">No data. Check the status message.</p>';
      return;
    }

    const attachments = data.attachments || [];
    // Filter to just images
    const imageAttachments = attachments.filter((a) =>
      (a.content_type || "").startsWith("image/")
    );

    currentUrls = imageAttachments.map((a) => a.url);

    renderAttachments(imageAttachments);

    if (imageAttachments.length) {
      setStatus(
        `Found ${imageAttachments.length} image${
          imageAttachments.length > 1 ? "s" : ""
        }. Click one to copy its URL, or "Copy All".`
      );
    } else {
      setStatus("No image attachments found for that message.");
    }
  } catch (e) {
    console.error(e);
    setStatus("Network error. Check your API URL.", true);
    listEl.innerHTML =
      '<p class="placeholder">Network error. Check console.</p>';
  } finally {
    fetchBtn.disabled = false;
  }
});

copyAllBtn.addEventListener("click", () => {
  if (!currentUrls.length) return;
  const text = currentUrls.join("\n");
  navigator.clipboard
    .writeText(text)
    .then(() => showToast("All image URLs copied"))
    .catch(() => showToast("Failed to copy"));
});
