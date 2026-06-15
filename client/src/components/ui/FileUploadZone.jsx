import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from './Icons';

export default function FileUploadZone({
  accept = '.pdf,application/pdf',
  maxSizeMB = 5,
  onFileSelect,
  selectedFile,
  onClear,
  variant = 'default',
  disabled = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(false);
  };

  const validateAndSelectFile = (file) => {
    if (!file) return;
    
    setErrorMsg('');
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setErrorMsg(`File exceeds ${maxSizeMB}MB limit`);
      onFileSelect(null);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    validateAndSelectFile(file);
  };

  const handleFileChange = (e) => {
    if (disabled) return;
    const file = e.target.files[0];
    validateAndSelectFile(file);
  };

  const handleZoneClick = () => {
    if (disabled || selectedFile) return;
    fileInputRef.current?.click();
  };

  const handleClearClick = (e) => {
    e.stopPropagation();
    onClear();
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Base theme classes
  const hoverBorderColor = variant === 'ai' ? 'hover:border-[#8026d3]' : 'hover:border-[#8026d3]/40';
  const hoverBg = variant === 'ai' ? 'hover:bg-[rgba(128,38,211,0.04)]' : 'hover:bg-[rgba(128,38,211,0.02)]';
  const hoverIconColor = variant === 'ai' ? 'group-hover:text-[#8026d3]' : 'group-hover:text-[#8026d3]';

  const activeBorderColor = variant === 'ai' ? 'border-[#8026d3] bg-[rgba(128,38,211,0.06)]' : 'border-[#8026d3] bg-[rgba(128,38,211,0.03)]';

  return (
    <div className={`w-full ${disabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleZoneClick}
          className={`group border-[1.5px] border-dashed border-[#cfc2d6] bg-[#ffffff] rounded-[10px] p-8 text-center flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${hoverBorderColor} ${hoverBg} ${isDragOver ? activeBorderColor : ''}`}
        >
          <UploadCloud
            size={24}
            className={`text-[#76746f] transition-colors duration-150 ${hoverIconColor} mb-2`}
          />
          <p className="text-[14px] font-ui text-[#1a1a1a] mb-1 font-semibold">
            Drop PDF here or click to browse
          </p>
          <p className="text-[12px] font-ui text-[#666666]">
            Max {maxSizeMB}MB · PDF only
          </p>
        </div>
      ) : (
        <div className="border border-[rgba(128,38,211,0.25)] bg-[rgba(128,38,211,0.03)] rounded-[10px] px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText size={20} className="text-[#8026d3] shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[14px] font-ui text-[#1a1a1a] truncate max-w-[240px] font-semibold">
                {selectedFile.name}
              </p>
              <p className="text-[12px] font-ui text-[#666666]">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearClick}
            className="text-[#666666] hover:text-[#ff4d4d] p-1.5 transition-colors duration-120"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {errorMsg && (
        <p className="text-[12px] font-ui text-[#ff4d4d] mt-2 font-medium">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
