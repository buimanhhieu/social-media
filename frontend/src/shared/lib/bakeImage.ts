/** Áp chuỗi CSS filter vào ảnh qua canvas, trả về File JPEG mới để upload. */
export async function bakeImage(file: File, filter: string): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.filter = filter;
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', 0.92),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
