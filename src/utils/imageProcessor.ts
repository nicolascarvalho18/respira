import { Platform } from 'react-native';

export interface ProcessedImageResult {
  blob: Blob | File;
  previewUrl: string;
  contentType: string;
  extension: string;
}

function safeCreateObjectURL(file: Blob | File): string {
  try {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }
  } catch {
    // Fallback para ambientes sem BlobModule inicializado
  }
  return '';
}

/**
 * Processa e recorta uma imagem em formato quadrado (512x512),
 * comprimindo para WebP (ou JPEG se WebP não for suportado) para economizar dados e garantir alta qualidade.
 */
export async function processAvatarImage(file: File | Blob): Promise<ProcessedImageResult> {
  // Em ambientes não-web (SSR / React Native puro sem DOM)
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      blob: file,
      previewUrl: safeCreateObjectURL(file),
      contentType: file.type || 'image/jpeg',
      extension: 'webp',
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const targetSize = 512;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve({
              blob: file,
              previewUrl: safeCreateObjectURL(file),
              contentType: file.type || 'image/jpeg',
              extension: 'webp',
            });
            return;
          }

          // Cálculo do recorte central quadrado
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          // Renderização nítida
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

          // Exportar para WebP com fallback para JPEG
          const mimeType = 'image/webp';
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const previewUrl = safeCreateObjectURL(blob);
                resolve({
                  blob,
                  previewUrl,
                  contentType: 'image/webp',
                  extension: 'webp',
                });
              } else {
                // Fallback para JPEG
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      resolve({
                        blob: jpegBlob,
                        previewUrl: safeCreateObjectURL(jpegBlob),
                        contentType: 'image/jpeg',
                        extension: 'jpg',
                      });
                    } else {
                      resolve({
                        blob: file,
                        previewUrl: safeCreateObjectURL(file),
                        contentType: file.type || 'image/jpeg',
                        extension: 'webp',
                      });
                    }
                  },
                  'image/jpeg',
                  0.9
                );
              }
            },
            mimeType,
            0.9
          );
        } catch (canvasErr) {
          console.warn('[ImageProcessor] Canvas error, using original file:', canvasErr);
          resolve({
            blob: file,
            previewUrl: safeCreateObjectURL(file),
            contentType: file.type || 'image/jpeg',
            extension: 'webp',
          });
        }
      };

      img.onerror = () => {
        reject(new Error('Não foi possível ler a imagem selecionada.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao carregar o arquivo de imagem.'));
    };

    reader.readAsDataURL(file);
  });
}
