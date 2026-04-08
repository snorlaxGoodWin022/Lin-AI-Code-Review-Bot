const DEFAULT_IGNORE_PATTERNS = [
  /\.min\.js$/,
  /\.min\.css$/,
  /\.bundle\.js$/,
  /(^|\/)dist\//,
  /(^|\/)node_modules\//,
  /\.lock$/,
  /\.generated\./,
  /(^|\/)package-lock\.json$/,
  /(^|\/)yarn\.lock/,
  /(^|\/)pnpm-lock\.yaml$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
];

export function shouldReviewFile(file, customIgnorePatterns = []) {
  const fileName = file.to || file.from || '';
  if (!fileName || fileName === '/dev/null') {
    return false;
  }

  const allPatterns = [...DEFAULT_IGNORE_PATTERNS, ...customIgnorePatterns];
  for (const pattern of allPatterns) {
    if (typeof pattern === 'string') {
      if (fileName.includes(pattern)) return false;
    } else if (pattern instanceof RegExp) {
      if (pattern.test(fileName)) return false;
    }
  }

  // 只审查有实际代码变更的文件
  const hasCodeChanges = file.chunks?.some((chunk) =>
    chunk.changes?.some((change) => change.type === 'add' || change.type === 'del')
  );

  return hasCodeChanges !== false;
}

export function filterFiles(files, customIgnorePatterns = []) {
  return files.filter((file) => shouldReviewFile(file, customIgnorePatterns));
}
