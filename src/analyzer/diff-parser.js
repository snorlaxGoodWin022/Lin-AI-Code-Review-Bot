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

/**
 * 增量模式：只提取新增/修改的代码行，跳过未变更的上下文行
 * 保留 chunk header 以提供行号信息
 */
export function getIncrementalDiffText(file) {
  let diff = `--- ${file.from || '/dev/null'}\n+++ ${file.to || '/dev/null'}\n`;

  for (const chunk of file.chunks) {
    const addChanges = chunk.changes.filter(
      (c) => c.type === 'add'
    );

    // 如果这个 chunk 没有新增行，跳过
    if (addChanges.length === 0) continue;

    diff += chunk.content + '\n';

    // 保留少量上下文行（最多2行），帮助 AI 理解代码位置
    for (const change of chunk.changes) {
      if (change.type === 'add') {
        diff += change.content + '\n';
      } else if (change.type === 'normal') {
        // 上下文行只保留前缀标记，让 AI 知道位置
        diff += ' ...\n';
      }
      // 删除行（type === 'del'）完全跳过
    }
  }

  // 去掉连续的 ' ...' 行，只保留一个
  diff = diff.replace(/(\.\.\.\n){2,}/g, '...\n');

  return diff;
}
