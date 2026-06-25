import { type FormEvent, useState } from 'react';
import { Avatar } from '@shared/ui/Avatar';
import { timeAgo } from '@shared/lib/timeAgo';
import { usePostComments, useAddComment } from '../api/hooks';

export function CommentSection({ postId }: { postId: number }) {
  const { data, isLoading } = usePostComments(postId, true);
  const add = useAddComment(postId);
  const [text, setText] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    add.mutate({ content }, { onSuccess: () => setText('') });
  };

  const comments = data?.content ?? [];

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800">
      {isLoading ? (
        <p className="px-4 py-3 text-sm text-zinc-400">Đang tải bình luận…</p>
      ) : comments.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-400">Chưa có bình luận nào.</p>
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar src={c.author.avatarUrl} name={c.author.displayName ?? c.author.username} size="sm" />
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-white">{c.author.username}</span>{' '}
                  <span className="text-zinc-700 dark:text-zinc-300">{c.content}</span>
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">{timeAgo(c.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2 dark:border-zinc-800"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm bình luận…"
          className="h-9 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={!text.trim() || add.isPending}
          className="text-sm font-semibold text-accent disabled:text-zinc-300 dark:disabled:text-zinc-600"
        >
          Đăng
        </button>
      </form>
    </div>
  );
}
