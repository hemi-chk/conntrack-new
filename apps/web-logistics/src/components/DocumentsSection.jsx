import { useState, useRef } from "react";
import { FileText, Upload, Lock, X, FileCheck, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocumentsSection({ disabled, onFinishUpload }) {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles([...files, {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        id: Date.now()
      }]);
      e.target.value = null; // Reset for potential re-uploads
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  const handleFinish = () => {
    if (onFinishUpload) {
      onFinishUpload(files);
      // Optional: Clear files after finish or keep them for display
    }
    console.log("Finalizing upload for:", files);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          Shipping Documents
          <FileText size={18} className="text-[#1E40AF]" />
        </h2>
      </div>

      <div className="p-5 space-y-6">
        {/* Main Upload Box */}
        <div
          className={`group border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4
            ${disabled
              ? "bg-slate-50 border-slate-200"
              : "border-slate-300 bg-slate-50/30"
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />

          <div className={`p-4 rounded-full transition-colors ${disabled ? "bg-slate-100 text-slate-400" : "bg-white text-[#1E40AF] shadow-sm border border-slate-100"}`}>
            {disabled ? <Lock size={28} /> : <Upload size={28} />}
          </div>

          <div className="text-center space-y-1">
            <p className={`text-sm font-semibold ${disabled ? "text-slate-400" : "text-slate-600"}`}>
              {disabled ? "Upload is currently locked" : "Select shipping documents to attach"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              Maximum file size: 5MB
            </p>
          </div>

          {/* UPLOAD BUTTON */}
          <Button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current.click()}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 font-bold"
          >
            Choose File
          </Button>

          {disabled && (
            <div className="mt-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-md flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">
                Please select a handler first
              </span>
            </div>
          )}
        </div>

        {/* File List & Finalize Button */}
        {files.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between ml-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Attached Files ({files.length})
              </h3>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded text-emerald-600">
                      <FileCheck size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">{file.size}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </div>

            {/* FINISH UPLOAD BUTTON */}
            <Button
              onClick={handleFinish}
              className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-bold h-11 shadow-md shadow-blue-100 flex items-center justify-center gap-2"
            >
              <CloudUpload size={20} />
              Finish & Upload All Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}