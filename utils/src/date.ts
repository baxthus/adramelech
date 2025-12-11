export function toUnixTimestamp(timestamp: Date | number): number {
  const date = timestamp instanceof Date ? timestamp.getTime() : timestamp;
  return Math.floor(date / 1000);
}
