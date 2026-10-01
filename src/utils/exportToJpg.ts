import { toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Ensures high-resolution, unclipped export on mobile devices by temporarily
 * expanding the render container to 750px width and making table overflows visible.
 */
export const downloadAsJpg = async (elementId: string, fileName: string): Promise<boolean> => {
  const target =
    document.getElementById(elementId) ||
    (document.querySelector('.export-card-area') as HTMLElement) ||
    (document.querySelector('.export-card-wrapper') as HTMLElement);

  if (!target) {
    console.error(`[downloadAsJpg] Element #${elementId} or .export-card-area not found.`);
    alert('Report render container not found. Please try again.');
    return false;
  }

  const cleanFileName = fileName.trim().replace(/[/\\?%*:|"<>]/g, '_');

  // Save original styles for restoration
  const originalWidth = target.style.width;
  const originalMinWidth = target.style.minWidth;
  const originalMaxWidth = target.style.maxWidth;
  const originalOverflow = target.style.overflow;

  // Find all internal scrollable table containers
  const overflowContainers = target.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto');
  const originalOverflows: string[] = [];
  overflowContainers.forEach((el, idx) => {
    originalOverflows[idx] = el.style.overflow;
    el.style.overflow = 'visible';
  });

  // Temporarily set fixed width of 750px to ensure full layout capture without horizontal clipping
  target.style.width = '750px';
  target.style.minWidth = '750px';
  target.style.maxWidth = 'none';
  target.style.overflow = 'visible';

  try {
    // Allow browser frame to finish painting fonts, layout shifts, & images
    await new Promise((res) => setTimeout(res, 350));

    // Primary Engine: html-to-image (Ultra-fast and zero-crash on mobile Chrome/Android WebViews)
    try {
      const dataUrl = await toJpeg(target, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        width: 750,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '750px',
          minWidth: '750px',
          maxWidth: 'none',
          overflow: 'visible',
        },
        filter: (node) => {
          // Exclude no-print buttons, print-hidden elements, or spinners
          if (node instanceof HTMLElement) {
            if (
              node.classList.contains('no-print') ||
              node.classList.contains('print:hidden') ||
              node.getAttribute('data-no-export') === 'true'
            ) {
              return false;
            }
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${cleanFileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (primaryErr) {
      console.warn('Primary html-to-image engine failed, trying html2canvas fallback...', primaryErr);
    }

    // Fallback Engine: html2canvas with sanitized SVGs & explicit styles
    const scale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2;
    const canvas = await html2canvas(target, {
      scale,
      width: 750,
      windowWidth: 750,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) =>
        el.classList.contains('no-print') ||
        el.classList.contains('print:hidden') ||
        el.getAttribute('data-no-export') === 'true',
      onclone: (clonedDoc) => {
        const clonedEl =
          clonedDoc.getElementById(elementId) ||
          clonedDoc.getElementById(target.id) ||
          (clonedDoc.querySelector('.export-card-area') as HTMLElement) ||
          (clonedDoc.querySelector('.export-card-wrapper') as HTMLElement);

        if (clonedEl) {
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#111827';
          clonedEl.style.width = '750px';
          clonedEl.style.minWidth = '750px';
          clonedEl.style.maxWidth = 'none';
          clonedEl.style.minHeight = '300px';
          clonedEl.style.overflow = 'visible';

          const clonedOverflows = clonedEl.querySelectorAll<HTMLElement>('.overflow-x-auto, .overflow-y-auto');
          clonedOverflows.forEach((el) => {
            el.style.overflow = 'visible';
          });

          // Convert all calculated text, bg, border, and gradient styles to standard RGB/HEX
          const allNodes = clonedEl.querySelectorAll('*');
          allNodes.forEach((node: any) => {
            if (node.style) {
              node.style.fontFamily = 'Arial, sans-serif';

              try {
                const computed =
                  clonedDoc.defaultView?.getComputedStyle(node) ||
                  window.getComputedStyle(node);

                if (computed) {
                  if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
                    node.style.backgroundColor = '#ffffff';
                  }
                  if (computed.color && computed.color.includes('oklch')) {
                    node.style.color = '#111827';
                  }
                  if (computed.borderColor && computed.borderColor.includes('oklch')) {
                    node.style.borderColor = '#e5e7eb';
                  }
                  if (
                    node.style.backgroundImage &&
                    node.style.backgroundImage.includes('oklch')
                  ) {
                    node.style.backgroundImage = 'none';
                  }
                }
              } catch {
                // Ignore computed style errors on detached nodes
              }
            }
          });

          // Remove or handle inline SVG icons that crash canvas capture in older WebViews
          const svgs = clonedEl.querySelectorAll('svg');
          svgs.forEach((svg) => {
            svg.setAttribute('aria-hidden', 'true');
          });
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.90);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `${cleanFileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err: any) {
    console.error('JPG Export Error Details:', err);
    alert(`Export Error: ${err?.message || 'Could not generate image. Please try another theme.'}`);
    return false;
  } finally {
    // Restore original element layout styles after export completes
    target.style.width = originalWidth;
    target.style.minWidth = originalMinWidth;
    target.style.maxWidth = originalMaxWidth;
    target.style.overflow = originalOverflow;
    overflowContainers.forEach((el, idx) => {
      el.style.overflow = originalOverflows[idx] || '';
    });
  }
};

/**
 * Universal Alias for exportToJpg
 */
export const exportToJpg = downloadAsJpg;
