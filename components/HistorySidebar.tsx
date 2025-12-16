import React, { useEffect, useState } from 'react';
import { HistoryRecord, getHistoryList, clearHistory } from '../services/historyService';
import { formatFileSize } from '../services/msgpackService';
import { X, Clock, File, Trash2, ArrowRight } from 'lucide-react';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, onSelect }) => {
  const [history, setHistory] = useState<Omit<HistoryRecord, 'blob'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await getHistoryList();
    setHistory(data);
    setIsLoading(false);
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear the recent file history?")) {
      await clearHistory();
      setHistory([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-gray-900 font-semibold">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3>Recent Files</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            <p>No recent files</p>
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelect(item.id)}
              className="group p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer relative"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-gray-400 group-hover:text-blue-500">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-700">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded group-hover:bg-blue-100 group-hover:text-blue-600">
                      {formatFileSize(item.size)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 text-blue-400 self-center">
                   <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        </div>
      )}
    </div>
  );
};
