import path from 'path';

export default async function loadPhrases() {
  const rootPath = path.join(path.dirname(Bun.main), '..');
  const filePath = path.join(rootPath, 'assets', 'phrases.txt');
  const fileContent = await Bun.file(filePath).text();

  return fileContent
    .split('@@')
    .slice(1)
    .map((phrase) => {
      const [source, ...lines] = phrase.trim().split('\n');
      return {
        source: source.trim(),
        content: lines
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .join('\n'),
      };
    });
}
