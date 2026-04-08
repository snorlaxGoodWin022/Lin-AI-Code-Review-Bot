import parseDiff from 'parse-diff';

export function parseDiffContent(diffText) {
  const files = parseDiff(diffText);
  return files.map((file) => ({
    from: file.from,
    to: file.to,
    new: file.new,
    deleted: file.deleted,
    rename: file.rename,
    additions: file.additions,
    deletions: file.deletions,
    chunks: file.chunks.map((chunk) => ({
      content: chunk.content,
      oldStart: chunk.oldStart,
      oldLines: chunk.oldLines,
      newStart: chunk.newStart,
      newLines: chunk.newLines,
      changes: chunk.changes.map((change) => ({
        type: change.type, // 'normal' | 'add' | 'del'
        content: change.content,
        ln1: change.ln1,
        ln2: change.ln2,
        ln: change.ln,
      })),
    })),
  }));
}

export function getFileName(file) {
  if (file.to && file.to !== '/dev/null') {
    return file.to.replace(/^b\//, '');
  }
  if (file.from && file.from !== '/dev/null') {
    return file.from.replace(/^a\//, '');
  }
  return 'unknown';
}

export function getFileDiffText(file) {
  let diff = `--- ${file.from || '/dev/null'}\n+++ ${file.to || '/dev/null'}\n`;
  for (const chunk of file.chunks) {
    diff += chunk.content + '\n';
    for (const change of chunk.changes) {
      diff += change.content + '\n';
    }
  }
  return diff;
}
