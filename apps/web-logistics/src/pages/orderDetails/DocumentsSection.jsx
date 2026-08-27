import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

export default function DocumentsSection({
    stageName,
    disabled = false,
    existingFiles = [],
    onFinishUpload,
    onDelete,
}) {
    const inputRef = useRef(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files || []).map((rawFile) => ({
            rawFile,
        }));
        setSelectedFiles(files);
        event.target.value = "";
    };

    const handleUpload = async () => {
        if (!selectedFiles.length || disabled) return;
        await onFinishUpload(selectedFiles);
        setSelectedFiles([]);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-800">
                        Upload {stageName} documents
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        PDF, PNG, or JPG files up to 5 MB each.
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    multiple
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Upload size={14} />
                    Choose files
                </button>
            </div>

            {selectedFiles.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-bold text-blue-800">
                        {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
                    </p>
                    <button
                        type="button"
                        onClick={handleUpload}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800"
                    >
                        <Upload size={14} />
                        Upload files
                    </button>
                </div>
            )}

            {existingFiles.length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {existingFiles.map((file) => (
                        <div
                            key={file.document_id}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <FileText size={17} className="shrink-0 text-blue-600" />
                            <a
                                href={file.file_url || file.document_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 hover:text-blue-700"
                            >
                                {file.file_name || file.document_name || `Document ${file.document_id}`}
                            </a>
                            <button
                                type="button"
                                onClick={() => onDelete(file.document_id)}
                                aria-label="Delete document"
                                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="py-2 text-center text-xs font-medium text-slate-400">
                    No documents uploaded for this stage.
                </p>
            )}
        </div>
    );
}