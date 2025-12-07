import React, { useRef, useState } from 'react';
import { Upload, Camera, X } from 'lucide-react';

interface UploadAreaProps {
  label: string;
  subLabel?: string;
  image: string | null;
  onImageChange: (base64: string | null) => void;
  className?: string;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  label,
  subLabel,
  image,
  onImageChange,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Strip prefix for API usage later if needed, but for display we keep it. 
      // The service will handle stripping or using full string.
      // Usually Gemini API expects just base64 data without prefix for inlineData.data
      // We will store full string here for preview, and strip in service.
      onImageChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`relative group ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      {image ? (
        <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm group-hover:border-blue-400 transition-colors">
          <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-center text-white text-xs font-medium backdrop-blur-sm">
            {label}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`
            w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
          `}
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload size={28} />
          </div>
          <p className="text-gray-900 font-semibold mb-1">{label}</p>
          {subLabel && <p className="text-gray-500 text-sm text-center px-4">{subLabel}</p>}
        </div>
      )}
    </div>
  );
};