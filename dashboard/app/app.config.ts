export default defineAppConfig({
  ui: {
    colors: {
      primary: 'violet',
      neutral: 'zinc',
    },
    table: {
      slots: {
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0',
      },
    },
  },
  data: {
    repository: 'https://github.com/baxthus/adramelech',
  },
});
