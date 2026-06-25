import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { Button } from '@shared/ui/Button';
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
      <form onSubmit={onSave} className="mx-auto max-w-md space-y-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
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
            <p className="text-xs text-zinc-500">JPG hoặc PNG.</p>
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
          <label htmlFor="bio" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tiểu sử
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={150}
            placeholder="Giới thiệu đôi nét về bạn…"
            className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="text-right text-xs text-zinc-400">{bio.length}/150</span>
        </div>

        <Input
          label="Website"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          maxLength={500}
          placeholder="vd: example.com"
        />

        <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="pr-4">
            <label htmlFor="priv" className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Tài khoản riêng tư
            </label>
            <p className="text-xs text-zinc-500">
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
    </AppShell>
  );
}
