import { EdgeSettings, BackgroundSettings } from '../types';

/**
 * Load an image from a URL or Data URI safely into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Falha ao carregar imagem: ' + err));
    img.src = src;
  });
}

/**
 * Convert a Blob to a Data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Advanced Edge Refinement & White Halo Eliminator
 * Cleans white fringes, light halos, and background color bleed around people and hair.
 */
export function processCutoutEdges(
  originalImg: HTMLImageElement,
  cutoutImg: HTMLImageElement,
  settings: EdgeSettings
): HTMLCanvasElement {
  const width = cutoutImg.naturalWidth || cutoutImg.width;
  const height = cutoutImg.naturalHeight || cutoutImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  // Draw the original cutout
  ctx.drawImage(cutoutImg, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Alpha Cutoff: Clean faint translucent ghost pixels (the outer white haze)
  const cutoff = settings.alphaCutoff ?? 20;
  if (cutoff > 0) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < cutoff) {
        data[i + 3] = 0;
      }
    }
  }

  // 2. Morphological Shift (Choke / Erosion of Alpha to eat 1-2px white borders)
  const shift = Math.round(settings.shift);
  if (shift !== 0) {
    const originalAlphas = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      originalAlphas[i] = data[i * 4 + 3];
    }

    const radius = Math.abs(shift);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let alpha = originalAlphas[y * width + x];

        if (shift < 0) {
          // Erosion (Choke): eat outer border
          let minAlpha = alpha;
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              // Circular kernel for smooth boundary
              if (dx * dx + dy * dy <= radius * radius) {
                const nAlpha = originalAlphas[ny * width + nx];
                if (nAlpha < minAlpha) minAlpha = nAlpha;
              }
            }
          }
          alpha = minAlpha;
        } else if (shift > 0) {
          // Dilation (Expand)
          let maxAlpha = alpha;
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= height) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= width) continue;
              if (dx * dx + dy * dy <= radius * radius) {
                const nAlpha = originalAlphas[ny * width + nx];
                if (nAlpha > maxAlpha) maxAlpha = nAlpha;
              }
            }
          }
          alpha = maxAlpha;
        }

        data[idx + 3] = alpha;
      }
    }
  }

  // 3. Contrast adjustment on alpha
  const contrastFactor = settings.contrast ?? 1;
  if (contrastFactor !== 1) {
    for (let i = 0; i < data.length; i += 4) {
      let a = data[i + 3];
      if (a > 0 && a < 255) {
        const norm = a / 255;
        // S-curve contrast
        const adjusted = norm > 0.5
          ? 1 - 0.5 * Math.pow(2 * (1 - norm), contrastFactor)
          : 0.5 * Math.pow(2 * norm, contrastFactor);
        data[i + 3] = Math.min(255, Math.max(0, Math.round(adjusted * 255)));
      }
    }
  }

  // 4. Dedicated White Halo Eliminator (Photoshop "Remove White Matte" & Inward Color Padding)
  if (settings.removeWhiteHalo) {
    const intensity = (settings.whiteHaloIntensity ?? 80) / 100;

    // First pass: De-multiply white matte on semi-transparent pixels
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0 && alpha < 250) {
        const aNorm = alpha / 255;
        // Weight by how semi-transparent the pixel is
        const weight = (1 - aNorm) * intensity;

        // Un-multiply white (255) contamination:
        // C_fg = (C_observed - 255 * (1 - a) * weight) / (1 - (1 - a) * weight)
        const denom = Math.max(0.01, 1 - (1 - aNorm) * weight);

        let r = (data[i] - 255 * (1 - aNorm) * weight) / denom;
        let g = (data[i + 1] - 255 * (1 - aNorm) * weight) / denom;
        let b = (data[i + 2] - 255 * (1 - aNorm) * weight) / denom;

        // If the pixel is exceptionally bright compared to surrounding (white halo), clamp brightness
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        if (luma > 180) {
          const suppression = Math.min(1, ((luma - 180) / 75) * intensity);
          r = r * (1 - suppression * 0.4);
          g = g * (1 - suppression * 0.4);
          b = b * (1 - suppression * 0.4);
        }

        data[i] = Math.min(255, Math.max(0, Math.round(r)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }
    }

    // Second pass: Inward Color Propagation for edge pixels
    // Replace light edge pixel colors with the color of the closest solid interior pixel
    const sampleRadius = 3;
    const alphas = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      alphas[i] = data[i * 4 + 3];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = alphas[y * width + x];

        // Focus on boundary pixels with lower opacity that tend to show white fringes
        if (alpha > 5 && alpha < 190) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;

          // If the pixel has high brightness (typical of white background bleed)
          if (luma > 150) {
            // Find nearby opaque subject pixel
            let bestWeight = 0;
            let sumR = 0, sumG = 0, sumB = 0;

            for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
              const ny = y + dy;
              if (ny < 0 || ny >= height) continue;
              for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= width) continue;
                const nIdx = (ny * width + nx) * 4;
                const nAlpha = alphas[ny * width + nx];

                // Check for solid interior subject pixel
                if (nAlpha > 220) {
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const w = (sampleRadius + 1 - dist) * (nAlpha / 255);
                  if (w > 0) {
                    sumR += data[nIdx] * w;
                    sumG += data[nIdx + 1] * w;
                    sumB += data[nIdx + 2] * w;
                    bestWeight += w;
                  }
                }
              }
            }

            if (bestWeight > 0) {
              const targetR = sumR / bestWeight;
              const targetG = sumG / bestWeight;
              const targetB = sumB / bestWeight;

              // Blend inward color according to intensity
              const blendFactor = Math.min(1, intensity * (1 - alpha / 255) * 1.2);
              data[idx] = Math.round(r * (1 - blendFactor) + targetR * blendFactor);
              data[idx + 1] = Math.round(g * (1 - blendFactor) + targetG * blendFactor);
              data[idx + 2] = Math.round(b * (1 - blendFactor) + targetB * blendFactor);
            }
          }
        }
      }
    }
  }

  // 5. Standard Defringe / Color Despill
  if (settings.defringe) {
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 15 && alpha < 235) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        const saturationScale = 0.82;
        data[i] = Math.round(r * saturationScale + luma * (1 - saturationScale));
        data[i + 1] = Math.round(g * saturationScale + luma * (1 - saturationScale));
        data[i + 2] = Math.round(b * saturationScale + luma * (1 - saturationScale));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 6. Feathering on Alpha ONLY (softens boundary without bleeding white color)
  if (settings.feather > 0) {
    const featherCanvas = document.createElement('canvas');
    featherCanvas.width = width;
    featherCanvas.height = height;
    const fCtx = featherCanvas.getContext('2d');
    if (fCtx) {
      fCtx.filter = `blur(${settings.feather}px)`;
      fCtx.drawImage(canvas, 0, 0);

      const fData = fCtx.getImageData(0, 0, width, height).data;
      const finalData = ctx.getImageData(0, 0, width, height);

      // Only update alpha from blurred canvas, keep cleaned RGB intact!
      for (let i = 0; i < finalData.data.length; i += 4) {
        finalData.data[i + 3] = fData[i + 3];
      }
      ctx.putImageData(finalData, 0, 0);
    }
  }

  return canvas;
}

/**
 * Composite the cutout subject with a chosen background
 */
export async function renderCompositedCanvas(
  originalImg: HTMLImageElement,
  cutoutCanvas: HTMLCanvasElement,
  bgSettings: BackgroundSettings,
  forExport: boolean = false
): Promise<HTMLCanvasElement> {
  const width = cutoutCanvas.width;
  const height = cutoutCanvas.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, width, height);

  if (bgSettings.type === 'transparent') {
    if (!forExport) {
      drawCheckerboard(ctx, width, height, bgSettings.checkerboardDark);
    }
  } else if (bgSettings.type === 'color') {
    ctx.fillStyle = bgSettings.color;
    ctx.fillRect(0, 0, width, height);
  } else if (bgSettings.type === 'gradient') {
    const gradient = createGradient(ctx, width, height, bgSettings.gradient);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else if (bgSettings.type === 'blur-original') {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.filter = `blur(${bgSettings.blurRadius || 20}px)`;
      const bleed = Math.min(20, (bgSettings.blurRadius || 20) * 1.5);
      tCtx.drawImage(originalImg, -bleed, -bleed, width + bleed * 2, height + bleed * 2);
      ctx.drawImage(tempCanvas, 0, 0, width, height);
    }
  } else if (bgSettings.type === 'custom-image' && bgSettings.customImageUrl) {
    try {
      const customImg = await loadImage(bgSettings.customImageUrl);
      drawCoverImage(ctx, customImg, width, height);
    } catch (e) {
      console.warn('Failed to draw custom background:', e);
    }
  }

  // Draw the cleaned cut person
  ctx.drawImage(cutoutCanvas, 0, 0, width, height);

  return canvas;
}

/**
 * Generate a high contrast black & white alpha mask image
 */
export function generateAlphaMaskCanvas(cutoutCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const width = cutoutCanvas.width;
  const height = cutoutCanvas.height;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) return maskCanvas;

  ctx.drawImage(cutoutCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    data[i] = alpha;     // R
    data[i + 1] = alpha; // G
    data[i + 2] = alpha; // B
    data[i + 3] = 255;   // Solid alpha
  }

  ctx.putImageData(imgData, 0, 0);
  return maskCanvas;
}

/**
 * Helper to draw checkerboard pattern onto a 2d context
 */
function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean
) {
  const size = 16;
  const c1 = isDark ? '#0f172a' : '#f8fafc';
  const c2 = isDark ? '#1e293b' : '#e2e8f0';

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, y, size, size);
    }
  }
}

/**
 * Helper to parse and create gradients
 */
function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradientKey: string
): CanvasGradient {
  const presets: Record<string, [string, string][]> = {
    'studio-gray': [['#1e293b', '#090d16']],
    'sunset': [['#f97316', '#db2777']],
    'ocean': [['#0284c7', '#2563eb']],
    'cyber': [['#8b5cf6', '#ec4899']],
    'emerald': [['#059669', '#0d9488']],
    'luxury-gold': [['#d97706', '#78350f']],
    'soft-pastel': [['#fbcfe8', '#bfdbfe']],
    'neon-night': [['#111827', '#312e81']],
  };

  const colors = presets[gradientKey] || [['#3b82f6', '#1d4ed8']];
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colors[0][0]);
  grad.addColorStop(1, colors[0][1]);
  return grad;
}

/**
 * Draw an image fitted as "cover"
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) {
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;

  const hRatio = targetWidth / imgWidth;
  const vRatio = targetHeight / imgHeight;
  const ratio = Math.max(hRatio, vRatio);

  const centerShiftX = (targetWidth - imgWidth * ratio) / 2;
  const centerShiftY = (targetHeight - imgHeight * ratio) / 2;

  ctx.drawImage(
    img,
    0,
    0,
    imgWidth,
    imgHeight,
    centerShiftX,
    centerShiftY,
    imgWidth * ratio,
    imgHeight * ratio
  );
}

/**
 * Copy a transparent PNG blob to the system clipboard
 */
export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
  }
  return false;
}

/**
 * Download a blob with a file name
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
