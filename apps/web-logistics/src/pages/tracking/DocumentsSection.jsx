import { useState, useRef, useEffect } from "react";
import { FileText, Upload, Lock, X, FileCheck, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsSection({
  disabled,
  stageName,
  onFinishUpload,
  existingFiles = []
}) {
  const fileInputRef = useRef(null);
  const [tempFiles, setTempFiles] = useState([]);

  // ✅ Only clear temporary files if the user switches to a different stage
  useEffect(() => {
    setTempFiles([]);
  }, [stageName]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Mapping multiple files if needed, or just keep it to one
    const newFiles = files.map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      id: Math.random().toString(36).substr(2, 9), // Better unique ID
      uploadDate: new Date().toLocaleTimeString(),
      rawFile: file // Keep reference if you need to upload to Supabase/S3 later
    }));

    setTempFiles((prev) => [...prev, ...newFiles]);
    e.target.value = null; // Reset input so same file can be picked again if deleted
  };

  const removeFile = (id) => {
    setTempFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleUploadClick = () => {
    if (tempFiles.length > 0) {
      onFinishUpload(tempFiles);
      setTempFiles([]); // Clear local queue after parent takes ownership
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-2.5 border-b flex justify-between items-center">
        <h2 className="text-[11px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-2">
          <FileText size={14} className="text-[#1E40AF]" />
          Clearance Docs: {stageName}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Upload Box */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors
            ${disabled
              ? "bg-slate-50 border-slate-200 cursor-not-allowed"
              : "border-slate-300 hover:border-[#1E40AF] hover:bg-blue-50/30 cursor-pointer"
            }`}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            multiple // Allow multiple files selection
          />

          <div className={`p-3 rounded-full ${disabled ? "bg-slate-100 text-slate-400" : "bg-white text-[#1E40AF] shadow-sm border"}`}>
            {disabled ? <Lock size={20} /> : <Upload size={20} />}
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {disabled ? "Upload Locked" : "Click to upload documents"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {disabled ? "This stage is not yet active" : "PDF, PNG, or JPG (Max 5MB)"}
            </p>
          </div>
        </div>

        {/* Selected Files Queue */}
        {tempFiles.length > 0 && (
          <div className="space-y-2 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ready to upload</span>
              <span className="text-[10px] text-slate-400">{tempFiles.length} file(s) selected</span>
            </div>

            {tempFiles.map((file) => (
              <div key={file.id} className="flex justify-between items-center bg-[#EFF6FF] border border-blue-100 p-2.5 rounded-lg group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="bg-blue-600 p-1.5 rounded text-white shrink-0">
                    <FileCheck size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{file.name}</span>
                    <span className="text-[10px] text-slate-500">{file.size}</span>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the upload box click
                    removeFile(file.id);
                  }}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}

            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
              className="w-full bg-[#1E40AF] hover:bg-blue-800 text-white shadow-md shadow-blue-200"
            >
              <CloudUpload size={16} className="mr-2" />
              Confirm & Submit Documents
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}