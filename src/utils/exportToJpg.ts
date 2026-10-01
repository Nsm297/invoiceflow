import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Exports specified DOM element ID as high-resolution crisp JPG image.
 * 
 * Includes optimizations for mobile canvas memory limits, CSS sanitization,
 * and reliable frame painting.
 */
export const downloadAsJpg = async (elementId: string, fileName: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    alert('Report template element not found. Please try again.');
    return false;
  }

  try {
    // 1. Allow browser frame to finish painting fonts & images
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 2. Dynamic scale calculation to prevent mobile browser canvas memory crashes
    const scale = typeof window !== 'undefined' && window.innerWidth < 768 ? 1.5 : 2;

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.backgroundColor = '#ffffff';

          // Fallback fonts & styles to prevent CSS parsing locks / oklch issues
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
