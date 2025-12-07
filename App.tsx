import React, { useState, useEffect, useRef } from 'react';
import { UploadArea } from './components/UploadArea';
import { ApiKeyModal } from './components/ApiKeyModal';
import { generateTryOnImages } from './services/geminiService';
import { AppState, GeneratedImage } from './types';
import { Shirt, Sparkles, Link as LinkIcon, AlertCircle, Loader2, Plus, X, Image as ImageIcon, Download } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  // Changed from single string to array of strings
  const [clothesImages, setClothesImages] = useState<string[]>([]);
  const [clothesLink, setClothesLink] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'link' | 'image'>('link');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check API key on mount
  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Assume success as per instructions
      setHasApiKey(true);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAddClothesImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Filter for images
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;

    try {
      // Read all files in parallel
      const newImages = await Promise.all(imageFiles.map(readFileAsBase64));
      setClothesImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error("Error reading images:", error);
      setErrorMsg("Failed to upload some images. Please try again.");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeClothesImage = (index: number) => {
    setClothesImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownload = (url: string, view: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `virtual-fit-${view.toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!userImage) {
      setErrorMsg("Please upload a photo of yourself first.");
      return;
    }
    if (inputMethod === 'link' && !clothesLink.trim()) {
      setErrorMsg("Please provide a valid link to the clothing item.");
      return;
    }
    if (inputMethod === 'image' && clothesImages.length === 0) {
      setErrorMsg("Please upload at least one image of the clothing item.");
      return;
    }

    setAppState(AppState.GENERATING);
    setErrorMsg(null);
    setResults([]);

    try {
      // Helper to parse data URL into mimeType and base64 data
      const parseDataUrl = (dataUrl: string) => {
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          throw new Error("Invalid image format");
        }
        return { mimeType: matches[1], data: matches[2] };
      };

      const userImgObj = parseDataUrl(userImage);
      
      const clothesImgObjs = clothesImages.map(img => parseDataUrl(img));

      const generatedImages = await generateTryOnImages(userImgObj, clothesLink, clothesImgObjs);
      
      if (generatedImages.length === 0) {
        throw new Error("No images were generated. Please try again with a different image or link.");
      }

      setResults(generatedImages);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Something went wrong during generation. Please try again.");
      if (err.message && err.message.includes("Requested entity was not found")) {
          setHasApiKey(false); // Reset key state to force re-selection
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 text-slate-800 font-sans">
      
      {/* API Key Modal Overlay */}
      {!hasApiKey && <ApiKeyModal onSelectKey={handleSelectKey} />}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Shirt size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Virtual Fit AI
            </h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Powered by Gemini 3 Pro
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Intro */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Try on clothes instantly.
          </h2>
          <p className="text-lg text-slate-600">
            Upload your photo and one or more reference images for the clothes (front, back, details) to get the perfect fit.
          </p>
        </div>

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Column 1: User Photo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">1. Your Photo</h3>
              <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">Required</span>
            </div>
            <UploadArea 
              label="Upload full body photo" 
              subLabel="Ensure good lighting and a clear view"
              image={userImage} 
              onImageChange={setUserImage}
            />
          </div>

          {/* Column 2: Clothes Source */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">2. The Clothes</h3>
              
              {/* Toggle Input Method */}
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setInputMethod('link')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputMethod === 'link' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Link
                </button>
                <button 
                  onClick={() => setInputMethod('image')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${inputMethod === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Images
                </button>
              </div>
            </div>

            <div className="min-h-64 flex flex-col">
              {inputMethod === 'link' ? (
                <div className="h-64 bg-white border-2 border-slate-200 rounded-2xl p-6 flex flex-col justify-center items-center shadow-sm hover:border-indigo-300 transition-colors">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <LinkIcon size={28} />
                  </div>
                  <label className="w-full">
                    <span className="sr-only">Product URL</span>
                    <textarea
                      placeholder="Paste clothes product URL(s) here (one per line)..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm resize-none"
                      rows={3}
                      value={clothesLink}
                      onChange={(e) => setClothesLink(e.target.value)}
                    />
                  </label>
                  <p className="mt-4 text-xs text-center text-slate-400">
                    Supports major e-commerce sites via Google Search Grounding. Add multiple links for better context.
                  </p>
                </div>
              ) : (
                <div className="bg-white border-2 border-slate-200 border-dashed rounded-2xl p-4 min-h-[16rem]">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAddClothesImage}
                    className="hidden"
                    accept="image/*"
                    multiple // Allow multiple file selection
                  />
                  
                  {clothesImages.length === 0 ? (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-full flex flex-col items-center justify-center cursor-pointer py-10 text-slate-400 hover:text-indigo-600 transition-colors"
                     >
                        <div className="w-12 h-12 mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                          <ImageIcon size={24} />
                        </div>
                        <p className="font-medium">Click to upload images</p>
                        <p className="text-xs mt-1">Select multiple files (Front, Back, Details)</p>
                     </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {clothesImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={img} alt={`Clothes ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeClothesImage(idx)}
                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      
                      {/* Add Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                      >
                        <Plus size={24} />
                        <span className="text-xs font-medium mt-1">Add</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center mb-16">
          {errorMsg && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4 text-sm animate-shake">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={appState === AppState.GENERATING || !userImage}
            className={`
              relative overflow-hidden group
              bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
              px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-500/30 
              transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
            `}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <div className="relative flex items-center gap-2">
              {appState === AppState.GENERATING ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating your look...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Try On Now
                </>
              )}
            </div>
          </button>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <span className="w-2 h-8 bg-indigo-600 rounded-full inline-block"></span>
              Your Virtual Fit
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {results.map((img) => (
                <div key={img.id} className="group relative bg-white rounded-3xl p-4 shadow-xl border border-slate-100 overflow-hidden">
                  <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    {img.view} View
                  </div>
                  
                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(img.url, img.view)}
                    className="absolute top-6 right-6 z-10 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 p-2 rounded-full backdrop-blur-sm shadow-sm transition-all transform hover:scale-110 active:scale-95 border border-slate-100"
                    title="Download Image"
                  >
                    <Download size={20} />
                  </button>

                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100">
                    <img 
                      src={img.url} 
                      alt={`${img.view} fit`} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-3xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;