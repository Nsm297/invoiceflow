import html2canvas from 'html2canvas';

/**
 * Universal JPG Export Utility for InvoiceFlow
 * Exports specified DOM element ID as high-resolution crisp JPG image
 */
export const downloadAsJpg = async (elementId: string, fileName: string): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[downloadAsJpg] Element with ID "${elementId}" not found in DOM.`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // High DPI rendering for crisp text & borders
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Ensure white background and crisp contrast for image export
        const el = clonedDoc.getElementById(elementId);
        if (el) {
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111827';
          el.style.overflow = 'visible';
          el.style.maxHeight = 'none';
          el.style.height = 'auto';
          el.style.width = '100%';
        }
      },
    });

    const image = canvas.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.href = image;
    // Sanitize file name to avoid invalid characters
    const cleanFileName = fileName.trim().replace(/[/\\?%*:|"<>]/g, '_');
    link.download = `${cleanFileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error(`[downloadAsJpg] Error generating JPG image from #${elementId}:`, err);
    return false;
  }
};
