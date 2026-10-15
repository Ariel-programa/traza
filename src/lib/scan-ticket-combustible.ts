// Lógica compartida de escaneo de tickets de combustible: compresión de la
// foto (canvas) + OCR en el navegador (tesseract.js, sin API keys) + parseo
// de campos. La usan tanto el formulario de carga (TicketScanner) como el
// botón rápido de la lista (QuickScanButton), que dispara el mismo flujo
// antes de navegar al formulario.
import { parseTicketText, type TicketParseResult } from "@/lib/parse-ticket-combustible";

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.onload = () => {
      img.onerror = () => reject(new Error("No se pudo procesar la imagen."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible."));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function scanTicketImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ parsed: TicketParseResult; fotoDataUrl: string }> {
  const fotoDataUrl = await compressImage(file);

  // Import diferido: tesseract.js pesa varios MB (motor + wasm) y solo hace
  // falta cuando el usuario efectivamente escanea un ticket.
  const { default: Tesseract } = await import("tesseract.js");
  const { data } = await Tesseract.recognize(fotoDataUrl, "spa", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(Math.round(m.progress * 100));
    },
  });

  return { parsed: parseTicketText(data.text), fotoDataUrl };
}

// Puente entre el botón rápido (en la lista) y el formulario de alta: el
// resultado del escaneo se deja acá para que /combustible/nuevo lo recoja al
// montar. sessionStorage sobrevive a la navegación cliente-a-cliente de
// Next.js sin necesitar contexto global ni pasar el data URL por la URL.
const PENDING_KEY = "traza:pending-ticket-scan";
const PENDING_TTL_MS = 2 * 60 * 1000;

export type PendingTicketScan = { parsed: TicketParseResult; fotoDataUrl: string; ts: number };

export function savePendingTicketScan(parsed: TicketParseResult, fotoDataUrl: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ parsed, fotoDataUrl, ts: Date.now() }));
  } catch {
    // sessionStorage puede no estar disponible (modo privado, cuota llena) --
    // en ese caso el usuario simplemente completa el formulario a mano.
  }
}

export function takePendingTicketScan(): PendingTicketScan | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    const parsed = JSON.parse(raw) as PendingTicketScan;
    if (Date.now() - parsed.ts > PENDING_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
