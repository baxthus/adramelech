export default function dobounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
