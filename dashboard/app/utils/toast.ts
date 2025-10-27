export const loadingToast = {
  create(
    toastProvider: ReturnType<typeof useToast>,
    id: string,
    toast: Partial<Toast>,
  ) {
    toastProvider.add({
      id,
      ...toast,
      color: 'neutral',
      icon: useAppConfig().ui.icons.loading,
      close: false,
      duration: 0,
      ui: { icon: 'animate-spin' },
    });
  },

  update(
    toastProvider: ReturnType<typeof useToast>,
    id: string,
    toast: Partial<Toast>,
  ) {
    toastProvider.update(id, {
      icon: '',
      close: true,
      duration: useAppConfig().toaster.duration,
      ui: { icon: null },
      ...toast,
    });
  },
};
