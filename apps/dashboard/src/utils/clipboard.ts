import { toast } from 'sonner';

export async function copyToClipboard(content: string, name?: string) {
  await navigator.clipboard.writeText(content);
  toast.success(name ? `${name} copied to clipboard` : 'Copied to clipboard');
}
