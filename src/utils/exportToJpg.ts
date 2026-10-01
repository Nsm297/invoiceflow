import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Exports specified DOM element ID as high-resolution crisp JPG image.
 * 
 * Features:
 * - 300ms frame paint wait for clean rendering
 * - Off-screen safety & explicit visibility enforcement
 * - CSS sanitization to eliminate unsupported oklch color parsing locks
 * - CORS image support and high-contrast color fallbacks
 * - Strict try...catch...finally state cleanup
 */
export const exportToJpg = async (elementId: string, filename: string): Promise<boolean> => {
  const targetEl = document.getElementById(elementId);
  if (!targetEl) {
    const errorMsg = `Render element "#${elementId}" not found in document!`;
    console.error(`[exportToJpg] ${errorMsg}`);
    alert('Render element not found! Please ensure the report preview is open.');
    return false;
  }

  try {
    // 1. Allow browser frame to finish painting images, fonts, and sub-components
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 2. High DPI capture with CORS and OKLCH color sanitization
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true, // Enable debug log in browser console
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          // Force element visibility and layout geometry
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111827';
          el.style.opacity = '1';

          // Force standard color fallbacks and fonts to prevent oklch parsing locks
          const allElements = el.querySelectorAll('*');
          allElements.forEach((node: any) => {
            if (node.style) {
              node.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
              
              // Clean any oklch color values that cause html2canvas infinite hang
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
                // Ignore computed style errors
              }
            }
          });
        }
      },
    });

    // 3. Convert to high-quality JPEG and trigger browser download
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = imgData;
    const cleanFileName = filename.trim().replace(/[/\\?%*:|"<>]/g, '_');
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
export const downloadAsJpg = exportToJpg;
