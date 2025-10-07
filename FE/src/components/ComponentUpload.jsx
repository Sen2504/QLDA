import { useRef } from "react";

export default function ComponentUpload({
  files,
  setFiles,
  existingFiles = [],
  setExistingFiles,
  label = "Attachments",
}) {
  const inputRef = useRef(null);

  // Khi user chọn hoặc kéo thả file mới
  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles || []);
    setFiles((prev) => [...prev, ...arr]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveNew = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Khi user bấm ❌ file cũ
  const handleRemoveExisting = (fid) => {
    setExistingFiles((prev) =>
      prev.map((f) => (f.id === fid ? { ...f, _deleted: !f._deleted } : f))
    );
  };

  return (
    <div className="border-dashed border-2 border-gray-300 rounded-lg p-4 text-gray-500">
      {label && <p className="text-left text-gray-700 font-medium mb-2">{label}</p>}

      {/* Drop zone */}
      <div
        className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        Click or drop file(s) here
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Hiển thị file cũ */}
      {existingFiles.length > 0 && (
        <ul className="mt-4 text-sm text-left space-y-1">
          {existingFiles.map((f) => (
            <li
              key={f.id}
              className={`flex justify-between items-center border-b border-gray-100 py-1 ${
                f._deleted ? "line-through opacity-50" : ""
              }`}
            >
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {f.filename}
              </a>
              <button
                type="button"
                onClick={() => handleRemoveExisting(f.id)}
                className={`ml-2 text-xs font-medium ${
                  f._deleted
                    ? "text-gray-400 hover:text-emerald-600"
                    : "text-red-600 hover:text-red-800"
                }`}
              >
                {f._deleted ? "Undo" : "❌"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Hiển thị file mới */}
      {files.length > 0 && (
        <ul className="mt-3 text-sm text-left space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex justify-between items-center border-b border-gray-100 py-1"
            >
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                className="text-red-600 text-xs hover:underline"
                onClick={() => handleRemoveNew(i)}
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
