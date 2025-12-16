import React from 'react';
import { AnalysisResult } from '../types';
import { X, Sparkles, AlertCircle, FileText, Share2 } from 'lucide-react';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysis: AnalysisResult | null;
  error: string | null;
}

export const AiSidebar: React.FC<AiSidebarProps> = ({ isOpen, onClose, isLoading, analysis, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3>AI Analysis</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-sm">Analyzing data structure with Gemini...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Analysis Failed</p>
              <p className="text-xs mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && analysis && (
          <>
            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Overview</h4>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-800 leading-relaxed">{analysis.summary}</p>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Share2 className="w-3 h-3" /> Structure
              </h4>
              <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-600">
                {analysis.structure}
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Insights
              </h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 p-3 bg-purple-50 rounded-md border border-purple-100">
                    <span className="text-purple-400 font-bold">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
