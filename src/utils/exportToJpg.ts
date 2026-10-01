import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Supports:
 * - History View (#history-report-area)
 * - View Khata (#khata-report-area & #ledger-render-area)
 * - Monthly View (#monthly-report-area)
 * - Yearly View (#yearly-report-area)
 * - Invoice Print (#invoice-render-area)
 * - Fallback query selector (.export-card-wrapper)
 */
export const downloadAsJpg = async (elementId: string, fileName: string): Promise<boolean> => {
  // 1. Look up primary element ID with smart fallbacks
  let target = document.getElementById(elementId);
  
  if (!target && elementId === 'khata-report-area') {
    target = document.getElementById('ledger-render-area');
  } else if (!target && elementId === 'ledger-render-area') {
    target = document.getElementById('khata-report-area');
  }

  if (!target) {
    target = document.querySelector('.export-card-wrapper') as HTMLElement;
  }

  if (!target) {
    console.error(`[downloadAsJpg] Report element (${elementId}) not found in document.`);
    alert(`Report element (${elementId}) not ready. Please try again.`);
    return false;
  }

  try {
    // 2. Allow browser frame to finish painting fonts & layout elements
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 3. Dynamic scale to avoid mobile canvas memory limits (1.5x mobile, 2x desktop)
    const scale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2;

    const actualId = target.id || elementId;

    const canvas = await html2canvas(target, {
      scale,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl =
          clonedDoc.getElementById(actualId) ||
          clonedDoc.getElementById(elementId) ||
          clonedDoc.getElementById('khata-report-area') ||
          clonedDoc.getElementById('ledger-render-area') ||
          clonedDoc.getElementById('monthly-report-area') ||
          clonedDoc.getElementById('yearly-report-area') ||
          clonedDoc.getElementById('history-report-area') ||
          (clonedDoc.querySelector('.export-card-wrapper') as HTMLElement);

        if (clonedEl) {
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#111827';
          clonedEl.style.minHeight = '300px';

          // Sanitize child node styles to avoid CSS parsing locks or oklch errors
          const nodes = clonedEl.querySelectorAll('*');
          nodes.forEach((node: any) => {
            if (node.style) {
              node.style.fontFamily = 'sans-serif';

              try {
                const computed = clonedDoc.defaultView?.getComputedStyle(node);
                if (computed) {
                  if (computed.color && computed.color.includes('oklch')) {
                    node.style.color = '#111827';
                  }
                  if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
                    node.style.backgroundColor = '#ffffff';
                  }
                  if (computed.borderColor && computed.borderColor.includes('oklch')) {
                    node.style.borderColor = '#cbd5e1';
                  }
                }
              } catch {
                // Ignore style read issues on cloned nodes
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
