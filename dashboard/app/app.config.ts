export default defineAppConfig({
  ui: {
    colors: {
      primary: 'violet',
      neutral: 'neutral',
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
    icons: {
      home: 'lucide:house',
      phrases: 'lucide:quote',
      profiles: 'lucide:users',
      feedbacks: 'lucide:message-circle',
      clear: 'lucide:circle-x',
      user: 'lucide:user',
      github: 'lucide:github',
      logout: 'lucide:log-out',
      chevronUpDown: 'lucide:chevrons-up-down',
      menuVertical: 'lucide:ellipsis-vertical',
      trash: 'lucide:trash',
      reload: 'lucide:refresh-cw',
      theme: 'lucide:sun-moon',
      nothing: 'lucide:circle-slash-2',
    },
  },
  toaster: {
    duration: 5000,
  },
  data: {
    repository: 'https://github.com/baxthus/adramelech',
  },
});
