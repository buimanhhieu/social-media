import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getFriendlyMessage } from '@shared/api/errors';
import { useCreatePost, useUploadMedia } from '../api/hooks';

export function CreatePostForm({ onCreated }: { onCreated?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadMedia();
  const create = useCreatePost();
  const busy = upload.isPending || create.isPending;

  // Giải phóng object URL của ảnh xem trước khi rời trang.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pickFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Vui lòng chọn một tệp ảnh.');
      return;
    }
    setError(null);
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError(null);
    try {
      const media = await upload.mutateAsync(file);
      await create.mutateAsync({
        mediaIds: [media.id],
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
      });
      onCreated?.();
    } catch (err) {
      setError(getFriendlyMessage(err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5">
      <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">Tạo bài viết</h1>

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line text-stone-500 transition-colors hover:border-accent hover:text-accent dark:border-line-dark"
        >
          <ImagePlus className="h-10 w-10" strokeWidth={1.5} />
          <span className="text-sm font-medium">Chọn ảnh để đăng</span>
        </button>
      ) : (
        <div className="relative">
          <img src={preview} alt="Xem trước" className="aspect-square w-full rounded-2xl object-cover" />
          <button
            type="button"
            onClick={clearFile}
            aria-label="Bỏ ảnh"
            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFileChange} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="caption" className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Chú thích
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={2200}
          placeholder="Viết gì đó về khoảnh khắc này…"
          className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-line-dark dark:bg-surface-dark dark:text-stone-100"
        />
      </div>

      <Input
        label="Địa điểm"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Tuỳ chọn"
        maxLength={100}
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" fullWidth disabled={!file || busy}>
        {busy ? 'Đang đăng…' : 'Đăng bài'}
      </Button>
    </form>
  );
}
