import type { UseClipboardReturn } from '@vueuse/core';

export default function copyToClipboard(
  copy: UseClipboardReturn<false>['copy'],
  toast: ReturnType<typeof useToast>['add'],
  text: string,
  name?: string,
) {
  copy(text);
  toast({
    title: name ? `${name} copied to clipboard` : 'Copied to clipboard',
    color: 'success',
    icon: 'lucide:circle-check',
  });
}
