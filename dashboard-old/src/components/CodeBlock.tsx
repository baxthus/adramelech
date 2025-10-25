import { Code } from '@heroui/react';

export default function CodeBlock({ code }: { code: string }) {
  return (
    <Code className="py-2">
      <pre className="font-jetbrains-mono">{code}</pre>
    </Code>
  );
}
