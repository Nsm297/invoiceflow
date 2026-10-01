import { useState, useEffect, useCallback } from 'react';
import {
  JpgTemplateId,
  getSavedJpgTemplate,
  saveJpgTemplate,
  JPG_TEMPLATE_STORAGE_KEY,
} from '../types/template';

export function useJpgTemplate(initial?: JpgTemplateId) {
  const [template, setTemplateState] = useState<JpgTemplateId>(() => {
    return initial || getSavedJpgTemplate();
  });

  const setTemplate = useCallback((newTemplate: JpgTemplateId) => {
    setTemplateState(newTemplate);
    saveJpgTemplate(newTemplate);
  }, []);

  // Listen for storage events if template changes in another tab or component
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === JPG_TEMPLATE_STORAGE_KEY && e.newValue) {
        const val = e.newValue as JpgTemplateId;
        if (['classic', 'modern', 'compact', 'elegant'].includes(val)) {
          setTemplateState(val);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [template, setTemplate] as const;
}
