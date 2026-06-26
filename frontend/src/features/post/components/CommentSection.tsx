import { type FormEvent, useState } from 'react';
import { Avatar } from '@shared/ui/Avatar';
import { timeAgo } from '@shared/lib/timeAgo';
import { usePostComments, useAddComment } from '../api/hooks';

export function CommentSection({ postId }: { postId: number }) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePostComments(
    postId,
    true,
  );
  const add = useAddComment(postId);
  const [text, setText] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    add.mutate({ content }, { onSuccess: () => setText('') });
  };

  const comments = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <div className="border-t border-line dark:border-line-dark">
      {isLoading ? (
        <p className="px-4 py-3 text-sm text-stone-400">Đang tải bình luận…</p>
      ) : comments.length === 0 ? (
        <p className="px-4 py-3 text-sm text-stone-400">Chưa có bình luận nào.</p>
      ) : (
        <ul className="max-h-72 space-y-3 overflow-y-auto px-4 py-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <Avatar src={c.author.avatarUrl} name={c.author.displayName ?? c.author.username} size="sm" />
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-stone-900 dark:text-white">{c.author.username}</span>{' '}
                  <span className="text-stone-700 dark:text-stone-300">{c.content}</span>
                </p>
                <p className="mt-0.5 text-xs text-stone-400">{timeAgo(c.createdAt)}</p>
              </div>
            </li>
          ))}
          {hasNextPage && (
            <li>
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-sm text-stone-500 hover:underline disabled:opacity-50"
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bình luận'}
              </button>
            </li>
          )}
        </ul>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-line px-4 py-2 dark:border-line-dark"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm bình luận…"
          className="h-9 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={!text.trim() || add.isPending}
          className="text-sm font-semibold text-accent disabled:text-stone-300 dark:disabled:text-stone-600"
        >
          Đăng
        </button>
      </form>
    </div>
  );
}
