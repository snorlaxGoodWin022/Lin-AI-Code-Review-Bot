const MAX_CHARS_PER_CHUNK = 15000; // 约 4000 tokens

export function chunkDiff(diffText, maxChars = MAX_CHARS_PER_CHUNK) {
  if (diffText.length <= maxChars) {
    return [diffText];
  }

  const lines = diffText.split('\n');
  const chunks = [];
  let currentChunk = [];

  for (const line of lines) {
    const testChunk = [...currentChunk, line];
    if (testChunk.join('\n').length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
    } else {
      currentChunk.push(line);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  return chunks;
}

export function shouldChunkFile(file) {
  const diffText = file.chunks
    .map((chunk) => chunk.changes.map((c) => c.content).join('\n'))
    .join('\n');
  return diffText.length > MAX_CHARS_PER_CHUNK;
}
