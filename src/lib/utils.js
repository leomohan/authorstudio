export const uid = (prefix = "id") =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const nowIso = () => new Date().toISOString();

export const stripHtml = (html = "") => {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, " ");
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const countWords = (html = "") =>
  stripHtml(html)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const formatDateTime = (value) => {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const moveItem = (items, fromIndex, toIndex) => {
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
};

export const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";

export const chapterLabel = (index) => `Chapter ${index + 1}`;

export const partLabel = (index) => `Part ${index + 1}`;

export const dataUrlToUint8Array = (dataUrl) => {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

export const getImageExtension = (mimeType = "") => {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
};

export const safeFileName = (value = "author-studio") =>
  value.replace(/[^a-z0-9-_]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase() ||
  "author-studio";
