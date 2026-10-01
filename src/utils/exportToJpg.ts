import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Robust against Tailwind CSS v4 OKLCH colors, CSS variable gradients,
 * and mobile canvas memory limits.
 */
export const downloadAsJpg = async (elementId: string, fileName: string): Promise<boolean> => {
  const target =
    document.getElementById(elementId) ||
    (document.querySelector('.export-card-area') as HTMLElement) ||
    (document.querySelector('.export-card-wrapper') as HTMLElement);

  if (!target) {
    console.error(`[downloadAsJpg] Element #${elementId} or .export-card-area not found.`);
    alert('Report area not found. Please try again.');
    return false;
  }

  try {
    // Allow UI to settle and fonts to render
    await new Promise((res) => setTimeout(res, 300));

    const scale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2;

    const canvas = await html2canvas(target, {
      scale,
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
          clonedEl.style.minHeight = '300px';

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
                  // Clean oklch or unsupported color functions
                  if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
                    node.style.backgroundColor = '#ffffff';
                  }
                  if (computed.color && computed.color.includes('oklch')) {
                    node.style.color = '#111827';
                  }
                  if (computed.borderColor && computed.borderColor.includes('oklch')) {
                    node.style.borderColor = '#e5e7eb';
                  }

                  // Clear CSS gradient variables that might contain oklch
                  if (
                    node.style.backgroundImage &&
                    node.style.backgroundImage.includes('oklch')
                  ) {
                    node.style.backgroundImage = 'none';
                  }
                }
              } catch {
                // Ignore computed style access errors on detached nodes
              }
            }
          });
        }
      },
    });

    const image = canvas.toDataURL('image/jpeg', 0.90);
    const link = document.createElement('a');
    link.href = image;
    const cleanFileName = fileName.trim().replace(/[/\\?%*:|"<>]/g, '_');
    link.download = `${cleanFileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('JPG Export Error:', err);
    alert('Failed to generate JPG. Please try again.');
    return false;
  }
};

/**
 * Universal Alias for exportToJpg
 */
export const exportToJpg = downloadAsJpg;
