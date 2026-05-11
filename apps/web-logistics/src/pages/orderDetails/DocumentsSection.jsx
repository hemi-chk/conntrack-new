import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  X,
  FileCheck,
  CloudUpload,
  Loader2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DocumentsSection({
  disabled = false,
  stageName,
  onFinishUpload,
  existingFiles = [],
  showWarning = false,
  onDelete
}) {

  const fileInputRef = useRef(null);

  const [tempFiles, setTempFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // =========================================
  // RESET TEMP FILES WHEN STAGE CHANGES
  // =========================================

  useEffect(() => {
    setTempFiles([]);
  }, [stageName]);

  // =========================================
  // FILE VALIDATION
  // =========================================

  const validateFile = (file) => {

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg"
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {

      alert(
        `${file.name} is invalid.\nOnly PDF, PNG, JPG allowed.`
      );

      return false;
    }

    if (file.size > maxSize) {

      alert(
        `${file.name} exceeds 5MB size limit.`
      );

      return false;
    }

    return true;
  };

  // =========================================
  // HANDLE FILE PICK
  // =========================================

  const handleFileChange = (e) => {

    const files = Array.from(e.target.files);

    if (!files.length) return;

    const validFiles = files.filter(validateFile);

    // Prevent duplicate file names
    const filteredFiles = validFiles.filter((newFile) => {

      const existsInTemp = tempFiles.some(
        (file) => file.name === newFile.name
      );

      const existsInUploaded = existingFiles.some(
        (file) =>
          file.document_name === newFile.name
      );

      return !existsInTemp && !existsInUploaded;
    });

    if (filteredFiles.length !== validFiles.length) {
      alert("Some duplicate files were skipped.");
    }

    const mappedFiles = filteredFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      rawFile: file,
      uploadDate: new Date().toLocaleString()
    }));

    setTempFiles((prev) => [
      ...prev,
      ...mappedFiles
    ]);

    e.target.value = null;
  };

  // =========================================
  // REMOVE TEMP FILE
  // =========================================

  const removeFile = (id) => {

    setTempFiles((prev) =>
      prev.filter((file) => file.id !== id)
    );
  };

  // =========================================
  // UPLOAD FILES
  // =========================================

  const handleUploadClick = async () => {

    if (!tempFiles.length) return;

    try {

      setUploading(true);

      await onFinishUpload(tempFiles);

      setTempFiles([]);

    } catch (err) {

      console.error(err);

      alert("Upload failed");

    } finally {

      setUploading(false);
    }
  };

  // =========================================
  // UI
  // =========================================

  return (

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="bg-[#EFF6FF] p-2 rounded-xl">
              <FileText
                size={16}
                className="text-[#1E40AF]"
              />
            </div>

            <div>

              <h2 className="text-sm font-bold text-slate-800">
                {stageName}
              </h2>

              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5">
                Clearance Documents
              </p>

            </div>

          </div>

          {/* Existing File Count */}
          {existingFiles.length > 0 && (

            <div className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">

              {existingFiles.length} Uploaded

            </div>

          )}

        </div>

      </div>

      {/* ===================================== */}
      {/* CONTENT */}
      {/* ===================================== */}

      <div className="p-5 space-y-5">

        {/* ===================================== */}
        {/* WARNING MESSAGE */}
        {/* ===================================== */}

        {showWarning && (

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">

            <div className="flex items-start gap-3">

              <div className="bg-amber-100 p-2 rounded-lg shrink-0">

                <AlertTriangle
                  size={16}
                  className="text-amber-700"
                />

              </div>

              <div>

                <h3 className="text-sm font-bold text-amber-800">
                  Waiting for Assignment
                </h3>

                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Supplier and driver are not assigned yet.
                  You can still prepare documents now and upload later.
                </p>

              </div>

            </div>

          </div>

        )}

        {/* ===================================== */}
        {/* UPLOAD BOX */}
        {/* ===================================== */}

        <div
          onClick={() =>
            !disabled &&
            fileInputRef.current?.click()
          }
          className={`
            border-2 border-dashed rounded-2xl p-8
            flex flex-col items-center justify-center
            transition-all duration-200
            ${disabled
              ? "bg-slate-100 border-slate-200 cursor-not-allowed opacity-70"
              : "border-slate-300 hover:border-[#1E40AF] hover:bg-blue-50/40 cursor-pointer"
            }
          `}
        >

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            disabled={disabled}
            onChange={handleFileChange}
          />

          <div className={`
            p-4 rounded-full mb-3
            ${disabled
              ? "bg-slate-200 text-slate-400"
              : "bg-white text-[#1E40AF] shadow-sm border"
            }
          `}>

            <Upload size={22} />

          </div>

          <h3 className="font-semibold text-slate-700">

            {disabled
              ? "Uploads Disabled"
              : "Click to Upload Files"
            }

          </h3>

          <p className="text-xs text-slate-500 mt-1 text-center">

            PDF, PNG, JPG supported <br />
            Maximum file size: 5MB

          </p>

        </div>

        {/* ===================================== */}
        {/* EXISTING FILES */}
        {/* ===================================== */}

        {existingFiles.length > 0 && (

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wide">

                Uploaded Documents

              </p>

            </div>

            {existingFiles.map((file) => (
              <div key={file.document_id} className="flex items-center gap-2 group">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    flex-1 flex items-center justify-between
                    bg-green-50 border border-green-200
                    rounded-xl p-3
                    hover:bg-green-100 transition-colors
                  "
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-green-600 text-white p-2 rounded-lg shrink-0">
                      <FileCheck size={14} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {file.document_name || file.document_type || "Document"}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Version {file.version_number || 1}
                      </p>
                    </div>
                  </div>
                  <Eye size={16} className="text-slate-500 shrink-0" />
                </a>

                <Button
                  variant="ghost"
                  size="icon"
                  className="
                    h-11 w-11 text-slate-400
                    hover:text-red-600 hover:bg-red-50 hover:border-red-200
                    rounded-xl border border-slate-200 shrink-0
                    transition-all duration-200
                  "
                  title="Delete Document"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(file.document_id);
                  }}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}

          </div>

        )}

        {/* ===================================== */}
        {/* TEMP FILES */}
        {/* ===================================== */}

        {tempFiles.length > 0 && (

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wide">

                Ready to Upload

              </p>

              <span className="text-[10px] text-slate-500">

                {tempFiles.length} file(s)

              </span>

            </div>

            {tempFiles.map((file) => (

              <div
                key={file.id}
                className="
                  flex items-center justify-between
                  bg-blue-50 border border-blue-100
                  rounded-xl p-3
                "
              >

                <div className="flex items-center gap-3 overflow-hidden">

                  <div className="bg-[#1E40AF] text-white p-2 rounded-lg shrink-0">

                    <FileCheck size={14} />

                  </div>

                  <div className="overflow-hidden">

                    <p className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">

                      {file.name}

                    </p>

                    <p className="text-[10px] text-slate-500">

                      {file.size}

                    </p>

                  </div>

                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="
                    h-8 w-8 text-slate-400
                    hover:text-red-500
                    hover:bg-red-50
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >

                  <X size={14} />

                </Button>

              </div>

            ))}

            {/* ===================================== */}
            {/* SUBMIT BUTTON */}
            {/* ===================================== */}

            <Button
              onClick={handleUploadClick}
              disabled={uploading}
              className="
                w-full h-11
                bg-[#1E40AF]
                hover:bg-blue-800
                text-white
                rounded-xl
              "
            >

              {uploading ? (
                <>
                  <Loader2
                    size={16}
                    className="mr-2 animate-spin"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudUpload
                    size={16}
                    className="mr-2"
                  />
                  Confirm & Submit Documents
                </>
              )}

            </Button>

          </div>

        )}

      </div>

    </div>
  );
}