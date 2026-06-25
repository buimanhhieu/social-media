import { Link } from 'react-router-dom';
import { ImagePlus } from 'lucide-react';
import { Button } from '@shared/ui/Button';
import { useFeed } from '../api/hooks';
import { PostCard } from './PostCard';

export function Feed() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-96 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="py-16 text-center text-sm text-zinc-500">Không tải được bảng tin.</p>;
  }

  const posts = data?.pages.flatMap((p) => p.content) ?? [];

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="brand-gradient flex h-16 w-16 items-center justify-center rounded-2xl text-white">
          <ImagePlus className="h-7 w-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Chưa có bài viết nào</h2>
          <p className="mt-1 text-sm text-zinc-500">Theo dõi bạn bè hoặc đăng bài đầu tiên của bạn.</p>
        </div>
        <Link to="/create">
          <Button>Đăng bài</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
          </Button>
        </div>
      )}
    </div>
  );
}
