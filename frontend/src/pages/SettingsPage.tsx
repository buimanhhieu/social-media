import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { Input } from '@shared/ui/Input';
import { Toggle } from '@shared/ui/Toggle';
import { getFriendlyMessage } from '@shared/api/errors';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser, useUpdateProfile, useUploadAvatar } from '@features/user';

export function SettingsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: user } = useCurrentUser();
  const update = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? '');
    setBio(user.bio ?? '');
    setWebsiteUrl(user.websiteUrl ?? '');
    setIsPrivate(user.isPrivate);
  }, [user]);

  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const busy = update.isPending || uploadAvatar.isPending;

  const pickAvatar = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp ảnh.');
      return;
    }
    setError(null);
    setAvatarFile(f);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickAvatar(f);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const media = await uploadAvatar.mutateAsync(avatarFile);
        avatarUrl = media.url;
      }
      await update.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim(),
        websiteUrl: websiteUrl.trim(),
        isPrivate,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      navigate('/profile');
    } catch (err) {
      setError(getFriendlyMessage(err));
    }
  };

  return (
    <AppShell
      user={user}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      <Card className="mx-auto max-w-md">
        <form onSubmit={onSave} className="space-y-6">
        <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white">
          Chỉnh sửa trang cá nhân
        </h1>

        <div className="flex items-center gap-4">
          <Avatar
            src={avatarPreview ?? user?.avatarUrl}
            name={user?.displayName ?? user?.username}
            size="lg"
          />
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-semibold text-accent hover:underline"
            >
              Đổi ảnh đại diện
            </button>
            <p className="text-xs text-stone-500">JPG hoặc PNG.</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileChange} />
        </div>

        <Input
          label="Tên hiển thị"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="Tên của bạn"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Tiểu sử
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={150}
            placeholder="Giới thiệu đôi nét về bạn…"
            className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-stone-900 transition-colors placeholder:text-stone-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-line-dark dark:bg-surface-dark dark:text-stone-100"
          />
          <span className="text-right text-xs text-stone-400">{bio.length}/150</span>
        </div>

        <Input
          label="Website"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          maxLength={500}
          placeholder="vd: example.com"
        />

        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3 dark:border-line-dark">
          <div className="pr-4">
            <label htmlFor="priv" className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Tài khoản riêng tư
            </label>
            <p className="text-xs text-stone-500">
              Chỉ người theo dõi mới xem được bài viết của bạn.
            </p>
          </div>
          <Toggle id="priv" checked={isPrivate} onChange={setIsPrivate} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/profile')}>
            Huỷ
          </Button>
        </div>
        </form>
      </Card>
    </AppShell>
  );
}
