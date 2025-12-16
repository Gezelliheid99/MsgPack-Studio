import React, { useState, useCallback, useRef } from 'react';
import { Upload, Download, Save, RefreshCw, FileCode, CheckCircle, AlertTriangle, Sparkles, Clock, Minimize2, Maximize2 } from 'lucide-react';
import { parseMsgPack, encodeMsgPack, formatFileSize } from './services/msgpackService';
import { analyzeJsonStructure } from './services/geminiService';
import { addToHistory, getHistoryItem } from './services/historyService';
import { Button } from './components/Button';
import { CodeEditor, CodeEditorHandle } from './components/CodeEditor';
import { AiSidebar } from './components/AiSidebar';
import { HistorySidebar } from './components/HistorySidebar';
import { FileInfo, AnalysisResult } from './types';

function App() {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<CodeEditorHandle>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File | Blob, fileName?: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    setAnalysisResult(null);

    // Determine metadata
    const name = fileName || (file instanceof File ? file.name : 'Restored File');
    const size = file.size;
    const type = file.type || 'application/x-msgpack';

    try {
      setFileInfo({ name, size, type });

      // Artificial small delay for UI
      await new Promise(resolve => setTimeout(resolve, 100));

      const decoded = await parseMsgPack(file);
      const stringified = JSON.stringify(decoded, null, 2);
      
      setJsonContent(stringified);
      setSuccessMsg(`Successfully parsed ${name}`);

      // Save to history only if it's a fresh file upload (File object)
      if (file instanceof File) {
          addToHistory(file).catch(err => console.error("Failed to save to history", err));
      }

    } catch (err: any) {
      setError(err.message || "Failed to parse file");
      setJsonContent('');
      setFileInfo(null);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleHistorySelect = async (id: string) => {
    setIsHistoryOpen(false);
    setIsLoading(true);
    setError(null);
    try {
      const record = await getHistoryItem(id);
      if (record) {
        await processFile(record.blob, record.name);
      } else {
        setError("Could not retrieve file from history.");
        setIsLoading(false);
      }
    } catch (e) {
      setError("Failed to load history item.");
      setIsLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!jsonContent) return;
    try {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo ? `${fileInfo.name}.json` : 'output.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to generate JSON file");
    }
  };

  const handleDownloadMsgPack = () => {
    if (!jsonContent) return;
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const jsonObj = JSON.parse(jsonContent);
        const buffer = encodeMsgPack(jsonObj);
        const blob = new Blob([buffer], { type: 'application/x-msgpack' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const originalName = fileInfo?.name || 'output';
        const name = originalName.replace(/\.(json|msgpack)$/i, '') + '.msgpack';
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSuccessMsg("Repacked and downloaded successfully");
      } catch (err: any) {
        console.error(err);
        setError("Failed to repack. Your JSON might be invalid.");
      } finally {
        setIsLoading(false);
      }
    }, 50);
  };

  const handleAiAnalyze = async () => {
    if (!jsonContent) return;
    setIsAiSidebarOpen(true);
    
    if (analysisResult) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeJsonStructure(jsonContent);
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to analyze");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setJsonContent(value);
    }
  }, []);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if we are actually leaving the window or just entering a child element
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  return (
    <div 
      className="h-screen bg-gray-50 text-gray-900 flex flex-col font-sans overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center backdrop-blur-sm transition-opacity duration-200 pointer-events-none">
          <div className="border-4 border-dashed border-blue-400 rounded-3xl p-12 flex flex-col items-center">
            <Upload className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-blue-700">Drop file to open</h2>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-30 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold font-mono">
                MP
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 hidden sm:block">MsgPack Studio</h1>
            </div>
            
            <Button 
                variant="ghost" 
                onClick={() => setIsHistoryOpen(true)}
                title="Recent Files"
                className="text-gray-500 hover:text-black ml-2"
                icon={<Clock className="w-4 h-4" />}
            >
                History
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".msgpack,.dat,.bin" 
            />
            <Button 
              variant="secondary" 
              icon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isLoading}
            >
              Open File
            </Button>
            
            {jsonContent && (
              <>
                 <Button 
                  variant="ghost"
                  icon={<Sparkles className="w-4 h-4 text-purple-600" />}
                  onClick={handleAiAnalyze}
                  className="hidden sm:inline-flex"
                >
                  AI Analyze
                </Button>
                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
                <Button 
                  variant="secondary" 
                  icon={<FileCode className="w-4 h-4" />} 
                  onClick={handleDownloadJson}
                  title="Export as JSON"
                  className="hidden sm:inline-flex"
                >
                  JSON
                </Button>
                <Button 
                  variant="primary" 
                  icon={<Download className="w-4 h-4" />} 
                  onClick={handleDownloadMsgPack}
                  title="Repack and Download"
                >
                  Repack
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0">
        
        {/* Messages */}
        <div className="shrink-0 mb-4 space-y-2">
          {error && (
            <div className="p-4 rounded-md bg-red-50 border border-red-100 text-red-700 flex items-center gap-2 animate-fadeIn">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-md bg-green-50 border border-green-100 text-green-700 flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-5 h-5" />
              {successMsg}
            </div>
          )}
        </div>

        {/* Empty State / Editor */}
        {!jsonContent && !isLoading ? (
           <div 
             className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer min-h-0"
             onClick={() => fileInputRef.current?.click()}
           >
             <div className="bg-white p-4 rounded-full shadow-sm mb-4">
               <Upload className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900">No file loaded</h3>
             <p className="text-gray-500 mt-1 mb-6 max-w-sm text-center">
               Drag and drop or upload a MessagePack file to start.
             </p>
             <div className="flex gap-4">
                <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Select File
                </Button>
                 <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setIsHistoryOpen(true); }}>
                    View History
                </Button>
             </div>
           </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* File Info & Toolbar */}
            {fileInfo && (
              <div className="shrink-0 flex items-center justify-between text-xs text-gray-500 px-1">
                <div className="flex gap-4">
                  <span className="font-medium text-gray-700">{fileInfo.name}</span>
                  <span>{formatFileSize(fileInfo.size)}</span>
                  <span className="uppercase">{fileInfo.type}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => editorRef.current?.unfoldAll()}
                     className="flex items-center gap-1 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                     title="Expand all regions"
                   >
                     <Maximize2 className="w-3 h-3" />
                     <span>Expand All</span>
                   </button>
                   <button 
                     onClick={() => editorRef.current?.foldAll()}
                     className="flex items-center gap-1 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded transition-colors"
                     title="Collapse all regions"
                   >
                     <Minimize2 className="w-3 h-3" />
                     <span>Collapse All</span>
                   </button>
                </div>
              </div>
            )}
            
            {/* Editor Wrapper */}
            <div className="flex-1 relative min-h-0"> 
               {isLoading ? (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg border border-gray-200">
                    <RefreshCw className="w-8 h-8 text-black animate-spin mb-4" />
                    <p className="font-medium">Processing...</p>
                 </div>
               ) : null}
               <CodeEditor 
                 ref={editorRef}
                 value={jsonContent} 
                 onChange={onEditorChange} 
               />
            </div>
          </div>
        )}
      </main>

      {/* Sidebars */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSelect={handleHistorySelect}
      />
      
      <AiSidebar 
        isOpen={isAiSidebarOpen} 
        onClose={() => setIsAiSidebarOpen(false)}
        isLoading={isAnalyzing}
        analysis={analysisResult}
        error={analysisError}
      />
    </div>
  );
}

export default App;
