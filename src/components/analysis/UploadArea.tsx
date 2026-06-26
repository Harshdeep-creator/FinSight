import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Image, File, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  '.csv', '.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.txt',
];

const ACCEPTED_MIME = [
  'text/csv', 'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <Image size={18} className="text-neutral-500" />;
  if (ext === 'pdf') return <FileText size={18} className="text-red-400" />;
  if (['csv', 'xlsx', 'xls'].includes(ext || '')) return <File size={18} className="text-green-500" />;
  return <File size={18} className="text-neutral-400" />;
}

export function UploadArea({ onFileSelected, disabled }: UploadAreaProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError(`Unsupported file type: ${ext}. Supported: CSV, Excel, PDF, Image, Word, Text.`);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('File is too large. Maximum size: 100MB.');
      return;
    }
    setSelectedFile(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={onInputChange}
        disabled={disabled}
      />

      {selectedFile ? (
        <div className="card p-4 flex items-center gap-3">
          {getFileIcon(selectedFile.name)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--c-text-1)' }}>{selectedFile.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>{fmtSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={() => { setSelectedFile(null); setError(null); }}
            className="btn-ghost text-xs py-1 px-2"
            disabled={disabled}
          >
            Change
          </button>
        </div>
      ) : (
        <div
          className="relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer"
          style={{
            borderColor: dragging ? 'var(--c-text-3)' : 'var(--c-border)',
            background: dragging ? 'var(--c-bg-3)' : 'transparent'
          }}
          onDragEnter={() => !disabled && setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={e => { e.preventDefault(); !disabled && setDragging(true); }}
          onDrop={!disabled ? onDrop : undefined}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-colors" style={{ background: 'var(--c-bg-3)' }}>
              <Upload size={20} style={{ color: 'var(--c-text-3)' }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--c-text-2)' }}>
              {dragging ? 'Drop your file here' : 'Upload financial data'}
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--c-text-4)' }}>
              Drag and drop, or click to browse
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['CSV', 'Excel', 'PDF', 'Image', 'Word', 'Text'].map(t => (
                <span key={t} className="badge-neutral text-2xs">{t}</span>
              ))}
            </div>
            <p className="text-2xs mt-4" style={{ color: 'var(--c-text-5)' }}>Max file size: 100MB</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-start gap-2 p-2.5 rounded-md" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
        <span className="text-2xs px-2" style={{ color: 'var(--c-text-5)' }}>or use demo data</span>
        <div className="flex-1 h-px" style={{ background: 'var(--c-border)' }} />
      </div>
    </div>
  );
}
