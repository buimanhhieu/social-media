import { useRef, useState } from 'react';
import { Heart, Music as MusicIcon, Play, Search, Square, X } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { cn } from '@shared/lib/cn';
import { type MusicTab, useMusicTab, useToggleSaveMusic, useUploadMusic } from '../api/hooks';
import type { MusicTrack } from '../types';

const TABS: { key: MusicTab; label: string }[] = [
  { key: 'suggested', label: 'Gợi ý' },
  { key: 'explore', label: 'Khám phá' },
  { key: 'saved', label: 'Đã lưu' },
];

export function MusicPickerModal({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: number | null;
  onSelect: (track: MusicTrack | null) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<MusicTab>('suggested');
  const [q, setQ] = useState('');
  const { data: tracks, isLoading } = useMusicTab(tab, q);
  const toggleSave = useToggleSaveMusic();
  const uploadMusic = useUploadMusic();

  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [importing, setImporting] = useState(false);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const togglePlay = (id: number, url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
    } else {
      audio.src = url;
      void audio.play();
      setPlayingId(id);
    }
  };

  const doImport = async () => {
    if (!file || !name.trim()) return;
    const track = await uploadMusic.mutateAsync({ file, name: name.trim() });
    onSelect(track);
  };

  const items = tracks ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-surface dark:bg-surface-dark sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-line-dark">
          <h2 className="text-base font-bold text-stone-900 dark:text-white">Chọn nhạc</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-stone-500 hover:text-stone-900 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-accent text-white'
                  : 'text-stone-600 hover:bg-canvas dark:text-stone-300 dark:hover:bg-canvas-dark',
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setImporting((v) => !v)}
            className="ml-auto text-sm font-semibold text-accent"
          >
            {importing ? 'Đóng' : 'Import'}
          </button>
        </div>

        {/* Tìm kiếm (Khám phá) */}
        {tab === 'explore' && (
          <div className="relative px-4 pt-3">
            <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm nhạc theo tên…"
              className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-line-dark dark:bg-canvas-dark dark:text-stone-100"
            />
          </div>
        )}

        {/* Import */}
        {importing && (
          <div className="mx-4 mt-3 space-y-2 rounded-xl border border-line p-3 dark:border-line-dark">
            <input
              ref={fileRef}
              type="file"
              accept="audio/*,video/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full truncate rounded-lg border border-dashed border-line px-3 py-2 text-sm text-stone-600 hover:border-accent dark:border-line-dark dark:text-stone-300"
            >
              {file ? file.name : 'Chọn file nhạc hoặc video…'}
            </button>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên bài nhạc" maxLength={150} />
            <Button size="sm" fullWidth disabled={!file || !name.trim() || uploadMusic.isPending} onClick={doImport}>
              {uploadMusic.isPending ? 'Đang xử lý…' : 'Tải lên & chọn'}
            </Button>
          </div>
        )}

        <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

        {/* Danh sách */}
        <ul className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={cn(
                'w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                selectedId === null
                  ? 'bg-accent/10 font-semibold text-accent'
                  : 'text-stone-600 hover:bg-canvas dark:text-stone-300 dark:hover:bg-canvas-dark',
              )}
            >
              Không dùng nhạc
            </button>
          </li>

          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-stone-500">Đang tải…</li>
          ) : items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-stone-500">
              {tab === 'saved' ? 'Bạn chưa lưu bài nhạc nào.' : 'Chưa có nhạc nào.'}
            </li>
          ) : (
            items.map((t) => (
              <li key={t.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => togglePlay(t.id, t.url)}
                  aria-label="Nghe thử"
                  className="shrink-0 rounded-full p-2 text-stone-600 hover:bg-canvas dark:text-stone-300 dark:hover:bg-canvas-dark"
                >
                  {playingId === t.id ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(t)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition-colors',
                    selectedId === t.id
                      ? 'bg-accent/10 font-semibold text-accent'
                      : 'text-stone-800 hover:bg-canvas dark:text-stone-100 dark:hover:bg-canvas-dark',
                  )}
                >
                  <MusicIcon className="h-4 w-4 shrink-0 text-stone-400" />
                  <span className="truncate">{t.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSave.mutate({ id: t.id, saved: t.saved })}
                  aria-label={t.saved ? 'Bỏ lưu' : 'Lưu'}
                  className="shrink-0 rounded-full p-2 text-stone-400 hover:text-accent"
                >
                  <Heart className={cn('h-4 w-4', t.saved && 'fill-accent text-accent')} />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
