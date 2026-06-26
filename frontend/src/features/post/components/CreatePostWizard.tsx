import { type ChangeEvent, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Music as MusicIcon, Plus, X } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';
import { cn } from '@shared/lib/cn';
import { bakeImage } from '@shared/lib/bakeImage';
import { getFriendlyMessage } from '@shared/api/errors';
import { useCreatePost, useUploadMedia } from '../api/hooks';
import { MusicPickerModal } from './MusicPickerModal';
import type { MusicTrack } from '../types';

interface ImgItem {
  id: string;
  file: File;
  url: string;
  b: number;
  c: number;
  s: number;
  extra: string;
}

const PRESETS = [
  { label: 'Gốc', b: 1, c: 1, s: 1, extra: '' },
  { label: 'Sáng', b: 1.15, c: 1.05, s: 1.05, extra: '' },
  { label: 'Nét', b: 1, c: 1.25, s: 1.1, extra: '' },
  { label: 'Ấm', b: 1.05, c: 1, s: 1.25, extra: 'sepia(0.3)' },
  { label: 'Đen trắng', b: 1, c: 1.1, s: 1, extra: 'grayscale(1)' },
  { label: 'Mơ', b: 1.12, c: 0.9, s: 1.2, extra: '' },
];

const filterOf = (i: { b: number; c: number; s: number; extra: string }) =>
  `brightness(${i.b}) contrast(${i.c}) saturate(${i.s}) ${i.extra}`.trim();
const isEdited = (i: ImgItem) => i.b !== 1 || i.c !== 1 || i.s !== 1 || i.extra !== '';

let counter = 0;

export function CreatePostWizard({ onCreated }: { onCreated?: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [images, setImages] = useState<ImgItem[]>([]);
  const [active, setActive] = useState(0);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const [musicOpen, setMusicOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMedia = useUploadMedia();
  const createPost = useCreatePost();

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setError(null);
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `img-${counter++}`,
        file,
        url: URL.createObjectURL(file),
        b: 1,
        c: 1,
        s: 1,
        extra: '',
      })),
    ]);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((p) => p.id !== id);
    });
    setActive(0);
  };

  const patchActive = (patch: Partial<ImgItem>) =>
    setImages((prev) => prev.map((img, idx) => (idx === active ? { ...img, ...patch } : img)));

  const submit = async () => {
    if (images.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const mediaIds: number[] = [];
      for (const img of images) {
        const file = isEdited(img) ? await bakeImage(img.file, filterOf(img)) : img.file;
        const media = await uploadMedia.mutateAsync(file);
        mediaIds.push(media.id);
      }
      await createPost.mutateAsync({
        mediaIds,
        caption: caption.trim() || undefined,
        location: location.trim() || undefined,
        musicId: music?.id,
      });
      images.forEach((i) => URL.revokeObjectURL(i.url));
      onCreated?.();
    } catch (err) {
      setError(getFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const current = images[active];

  return (
    <Card className="mx-auto max-w-md">
      {/* Header bước */}
      <div className="mb-5 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </button>
        ) : (
          <span />
        )}
        <h1 className="text-base font-bold text-stone-900 dark:text-white">
          {step === 1 ? 'Chọn ảnh' : step === 2 ? 'Chỉnh sửa' : 'Tạo bài viết'}
        </h1>
        {step < 3 ? (
          <button
            type="button"
            disabled={images.length === 0}
            onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
            className="text-sm font-semibold text-accent disabled:text-stone-300 dark:disabled:text-stone-600"
          >
            Tiếp tục
          </button>
        ) : (
          <span />
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addFiles} />

      {/* BƯỚC 1 — chọn nhiều ảnh */}
      {step === 1 &&
        (images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line text-stone-500 transition-colors hover:border-accent hover:text-accent dark:border-line-dark"
          >
            <ImagePlus className="h-10 w-10" strokeWidth={1.5} />
            <span className="text-sm font-medium">Chọn một hoặc nhiều ảnh</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-canvas dark:bg-canvas-dark">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  aria-label="Bỏ ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-line text-stone-400 hover:border-accent hover:text-accent dark:border-line-dark"
              aria-label="Thêm ảnh"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
        ))}

      {/* BƯỚC 2 — chỉnh sửa */}
      {step === 2 && current && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl bg-canvas dark:bg-canvas-dark">
            <img
              src={current.url}
              alt="Xem trước"
              className="aspect-square w-full object-cover"
              style={{ filter: filterOf(current) }}
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={cn(
                    'h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2',
                    idx === active ? 'ring-accent' : 'ring-transparent',
                  )}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" style={{ filter: filterOf(img) }} />
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => patchActive({ b: p.b, c: p.c, s: p.s, extra: p.extra })}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-accent hover:text-accent dark:border-line-dark dark:text-stone-200"
              >
                {p.label}
              </button>
            ))}
          </div>

          <Slider label="Độ sáng" value={current.b} min={0.5} max={1.5} onChange={(b) => patchActive({ b })} />
          <Slider label="Tương phản" value={current.c} min={0.5} max={1.5} onChange={(c) => patchActive({ c })} />
          <Slider label="Bão hoà" value={current.s} min={0} max={2} onChange={(s) => patchActive({ s })} />
        </div>
      )}

      {/* BƯỚC 3 — caption + nhạc */}
      {step === 3 && (
        <div className="space-y-5">
          {current && (
            <div className="flex gap-3">
              <img
                src={current.url}
                alt=""
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
                style={{ filter: filterOf(current) }}
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                maxLength={2200}
                placeholder="Viết chú thích…"
                className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-line-dark dark:bg-surface-dark dark:text-stone-100"
              />
            </div>
          )}

          <Input
            label="Địa điểm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Tuỳ chọn"
            maxLength={100}
          />

          {/* Chọn nhạc — mở khung đầy đủ */}
          <div className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 dark:border-line-dark">
            <MusicIcon className="h-5 w-5 shrink-0 text-accent" />
            <button
              type="button"
              onClick={() => setMusicOpen(true)}
              className="min-w-0 flex-1 truncate text-left text-sm text-stone-700 dark:text-stone-200"
            >
              {music ? music.name : 'Thêm nhạc'}
            </button>
            {music ? (
              <button
                type="button"
                onClick={() => setMusic(null)}
                aria-label="Bỏ nhạc"
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setMusicOpen(true)} aria-label="Chọn nhạc" className="text-stone-400">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button fullWidth disabled={submitting} onClick={submit}>
            {submitting ? 'Đang đăng…' : 'Đăng bài'}
          </Button>
        </div>
      )}

      {step !== 3 && error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {musicOpen && (
        <MusicPickerModal
          selectedId={music?.id ?? null}
          onSelect={(t) => {
            setMusic(t);
            setMusicOpen(false);
          }}
          onClose={() => setMusicOpen(false)}
        />
      )}
    </Card>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-accent"
      />
    </label>
  );
}

