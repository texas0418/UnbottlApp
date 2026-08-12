/**
 * On-device QR generation and export for a venue's menu.
 *
 * The QR image used to be fetched from api.qrserver.com, which sent every
 * venue's menu URL to a third party, produced nothing offline, and offered
 * no way to get the image out of the app. Everything here is generated
 * locally: the `qrcode` package computes the matrix (the same generator
 * react-native-qrcode-svg uses for the on-screen code), expo-print turns
 * HTML into a PDF, and expo-sharing hands the file to the venue.
 */
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import QRCodeLib from 'qrcode';

/**
 * Raster export edge in pixels. 1024px prints a 3.4in code at 300dpi,
 * comfortably above what a table tent needs.
 */
export const QR_EXPORT_PX = 1024;

/**
 * Quiet zone for the raster export, in pixels. The QR spec wants at least
 * 4 modules of clear space; a ~33-module code at 1024px makes a module
 * ~31px, so 128px covers it with room to spare.
 */
export const QR_EXPORT_QUIET_ZONE = 128;

/** A filesystem-safe filename derived from the venue name. */
export function exportFileName(venueName: string, ext: 'png' | 'pdf'): string {
  const slug = venueName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `unbottl-qr-${slug || 'menu'}.${ext}`;
}

/** Minimal HTML escape for venue-supplied text interpolated into the PDF. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The print-ready page: venue name, the code, the URL spelled out for
 * anyone whose camera fails, and a small unbottl.com footer. Centering is
 * done with top padding rather than viewport-height flexbox — vh is
 * unreliable inside the WKWebView that expo-print renders with.
 */
export function qrPdfHtml(opts: {
  venueName: string;
  menuUrl: string;
  qrSvg: string;
  accent: string;
}): string {
  const { venueName, menuUrl, qrSvg, accent } = opts;
  const displayUrl = menuUrl.replace(/^https?:\/\//, '');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: letter; margin: 0; }
  body {
    margin: 0;
    padding-top: 1.8in;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    color: #1F1A17;
    text-align: center;
  }
  .venue { font-size: 30pt; font-weight: 700; margin: 0 0.75in 10pt; }
  /* border, not background — WKWebView drops background fills when printing */
  .rule { width: 1.2in; border: 0; border-top: 3pt solid ${accent}; margin: 0 auto 22pt; }
  .lead { font-size: 15pt; color: #55504C; margin: 0 0 28pt; }
  .qr svg { width: 3.2in; height: 3.2in; }
  .url { font-family: Menlo, monospace; font-size: 12pt; margin: 24pt 0 0; }
  .footer { font-size: 9pt; color: #9B948E; margin-top: 42pt; }
</style>
</head>
<body>
  <h1 class="venue">${escapeHtml(venueName)}</h1>
  <hr class="rule">
  <p class="lead">Scan for our beverage menu</p>
  <div class="qr">${qrSvg}</div>
  <p class="url">${escapeHtml(displayUrl)}</p>
  <p class="footer">Menu by unbottl.com</p>
</body>
</html>`;
}

/** The menu QR as an SVG string, generated locally. */
export function menuQrSvg(menuUrl: string, darkColor: string): Promise<string> {
  return QRCodeLib.toString(menuUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: darkColor, light: '#FFFFFF' },
  });
}

/**
 * Rasterize the hidden full-size QR that qr-menu.tsx mounts for export.
 * `ref` is the react-native-svg ref surfaced by react-native-qrcode-svg's
 * getRef; its toDataURL renders at the SVG's own size, which is why the
 * export QR is mounted at QR_EXPORT_PX rather than screen size.
 */
export function qrRefToPngBase64(ref: { toDataURL: (cb: (data: string) => void) => void } | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ref) {
      reject(new Error('The QR code has not rendered yet.'));
      return;
    }
    ref.toDataURL((data: string) => resolve(data));
  });
}

/** Write a base64 PNG to the cache directory and open the share sheet. */
export async function sharePngFromBase64(base64: string, filename: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.write(base64, { encoding: 'base64' });
  await Sharing.shareAsync(file.uri, {
    mimeType: 'image/png',
    UTI: 'public.png',
    dialogTitle: 'Save or print your menu QR code',
  });
}

/** Browser path: rasterize with the canvas the web already has, then download. */
export async function downloadPngWeb(menuUrl: string, filename: string, darkColor: string): Promise<void> {
  const dataUrl = await QRCodeLib.toDataURL(menuUrl, {
    width: QR_EXPORT_PX,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: darkColor, light: '#FFFFFF' },
  });
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

/**
 * Produce the print-ready PDF. Native: render to a file and share it (the
 * share sheet covers AirDrop, Files, Mail and Print). Web: expo-print can
 * only open the browser's print dialog, which still yields a PDF via
 * "Save as PDF".
 */
export async function exportQrPdf(opts: {
  venueName: string;
  menuUrl: string;
  accent: string;
}): Promise<void> {
  const qrSvg = await menuQrSvg(opts.menuUrl, opts.accent);
  const html = qrPdfHtml({ ...opts, qrSvg });
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const dest = new File(Paths.cache, exportFileName(opts.venueName, 'pdf'));
  if (dest.exists) dest.delete();
  new File(uri).move(dest);
  await Sharing.shareAsync(dest.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Save or print your menu QR sign',
  });
}
