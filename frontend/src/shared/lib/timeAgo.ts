/** Khoảng thời gian gọn kiểu mạng xã hội: "vừa xong", "5 phút", "3 giờ", "2 ngày", hoặc ngày tháng. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;

  return new Date(then).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
