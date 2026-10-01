import React from 'react';
import {
  JpgTemplateId,
  JPG_TEMPLATES,
  saveJpgTemplate,
} from '../types/template';

interface TemplateSelectorProps {
  selectedTemplate: JpgTemplateId;
  onSelectTemplate: (template: JpgTemplateId) => void;
  variant?: 'pills' | 'dropdown' | 'cards';
  className?: string;
  showDescriptions?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
  variant = 'pills',
  className = '',
  showDescriptions = false,
}) => {
  const handleSelect = (templateId: JpgTemplateId) => {
    onSelectTemplate(templateId);
    saveJpgTemplate(templateId);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 ${className}`}>
        <i className="fa-solid fa-palette text-indigo-600 text-xs"></i>
        <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">Theme:</span>
        <select
          value={selectedTemplate}
          onChange={(e) => handleSelect(e.target.value as JpgTemplateId)}
          className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none pr-1 py-1 cursor-pointer"
          title="Select JPG export layout theme"
        >
          {JPG_TEMPLATES.map((tmpl) => (
            <option key={tmpl.id} value={tmpl.id}>
              {tmpl.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${className}`}>
        {JPG_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelect(tmpl.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <i className={tmpl.icon}></i>
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-1">
                      <i className="fa-solid fa-check text-xs"></i> Active
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900">{tmpl.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{tmpl.tagline}</div>
              </div>
              {showDescriptions && (
                <p className="text-[10px] text-slate-600 mt-2 border-t border-slate-100 pt-1.5 leading-snug">
                  {tmpl.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'pills' variant
  return (
    <div className={`flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex-wrap ${className}`}>
      <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-slate-600 shrink-0">
        <i className="fa-solid fa-palette text-indigo-600"></i>
        <span className="hidden sm:inline">Theme:</span>
      </div>
      {JPG_TEMPLATES.map((tmpl) => {
        const isSelected = selectedTemplate === tmpl.id;
        return (
          <button
            key={tmpl.id}
            type="button"
            onClick={() => handleSelect(tmpl.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={tmpl.description}
          >
            <i className={`${tmpl.icon} text-[11px] ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}></i>
            <span>{tmpl.name}</span>
          </button>
        );
      })}
    </div>
  );
};
