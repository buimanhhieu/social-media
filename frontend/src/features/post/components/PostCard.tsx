import { useState } from 'react';
import { Heart, MapPin, MessageCircle } from 'lucide-react';
import { Avatar } from '@shared/ui/Avatar';
import { cn } from '@shared/lib/cn';
import { timeAgo } from '@shared/lib/timeAgo';
import { useLikePost, useUnlikePost } from '../api/hooks';
import { CommentSection } from './CommentSection';
import type { PostResponse } from '../types';

export function PostCard({ post }: { post: PostResponse }) {
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const like = useLikePost();
  const unlike = useUnlikePost();

  const author = post.author;
  const cover = post.media[0];

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    (next ? like : unlike).mutate(post.id, {
      onError: () => {
        setLiked(!next);
        setLikeCount((c) => c + (next ? -1 : 1));
      },
    });
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center gap-3 px-4 py-3">
        <Avatar src={author.avatarUrl} name={author.displayName ?? author.username} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{author.username}</p>
          {post.location && (
            <p className="flex items-center gap-1 truncate text-xs text-zinc-500">
              <MapPin className="h-3 w-3" strokeWidth={2} />
              {post.location}
            </p>
          )}
        </div>
        <span className="ml-auto shrink-0 text-xs text-zinc-400">{timeAgo(post.createdAt)}</span>
      </header>

      {cover && (
        <div className="relative bg-zinc-100 dark:bg-zinc-800">
          <img
            src={cover.url}
            alt={post.caption ?? 'Bài viết'}
            loading="lazy"
            className="aspect-square w-full object-cover"
            onDoubleClick={() => {
              if (!liked) toggleLike();
            }}
          />
          {post.media.length > 1 && (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              1/{post.media.length}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={toggleLike} aria-label="Thích" className="transition-transform active:scale-90">
          <Heart className={cn('h-6 w-6', liked ? 'fill-accent text-accent' : 'text-zinc-700 dark:text-zinc-200')} />
        </button>
        <button
          onClick={() => setShowComments((s) => !s)}
          aria-label="Bình luận"
          className="transition-transform active:scale-90"
        >
          <MessageCircle className="h-6 w-6 text-zinc-700 dark:text-zinc-200" />
        </button>
      </div>

      <div className="px-4 pb-3 pt-2">
        {likeCount > 0 && (
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            {likeCount.toLocaleString('vi-VN')} lượt thích
          </p>
        )}
        {post.caption && (
          <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
            <span className="font-semibold">{author.username}</span> {post.caption}
          </p>
        )}
        {post.commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="mt-1 text-sm text-zinc-500 hover:underline"
          >
            Xem tất cả {post.commentCount} bình luận
          </button>
        )}
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </article>
  );
}
