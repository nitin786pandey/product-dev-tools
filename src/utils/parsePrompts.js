/**
 * Parses raw prompt text with XML tags into a tree of sections.
 * Handles <root>, top-level tags (e.g. bot_introduction, response_instructions),
 * and nested tags (e.g. processes, order_retrieval_process).
 * Returns nodes with { tagName, label, content, children }.
 */

const TAG_REGEX = /<([a-zA-Z][a-zA-Z0-9_]*)>/g;

function humanize(tagName) {
  return tagName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Find the index of the matching closing tag for the opening tag at openStart.
 * openStart is the index of '<', openTagName is the tag name without brackets.
 * Handles nested same-name tags by counting depth.
 */
function findClosingTag(text, openStart, openTagName) {
  const openFull = `<${openTagName}>`;
  const closeFull = `</${openTagName}>`;
  let depth = 1;
  let i = openStart + openFull.length;

  while (depth > 0 && i < text.length) {
    const nextOpen = text.indexOf(openFull, i);
    const nextClose = text.indexOf(closeFull, i);

    if (nextClose === -1) return -1;
    if (nextOpen === -1 || nextClose < nextOpen) {
      depth--;
      if (depth === 0) return nextClose;
      i = nextClose + closeFull.length;
    } else {
      depth++;
      i = nextOpen + openFull.length;
    }
  }

  return -1;
}

/**
 * Extract only direct child XML elements: tags that appear at the top level of
 * `content`, not inside another tag. This prevents nested tags (e.g. <processes>
 * inside <custom_prompt>) from being returned as siblings at the root level.
 * Returns array of { tagName, openStart, closeIdx, innerContent }.
 */
function extractDirectChildTags(content) {
  const children = [];
  let pos = 0;

  while (pos < content.length) {
    const nextOpen = content.indexOf('<', pos);
    if (nextOpen === -1) break;

    TAG_REGEX.lastIndex = 0;
    const match = TAG_REGEX.exec(content.slice(nextOpen));
    if (!match) {
      pos = nextOpen + 1;
      continue;
    }

    const tagName = match[1];
    const openStart = nextOpen;
    const closeIdx = findClosingTag(content, openStart, tagName);
    if (closeIdx === -1) {
      pos = nextOpen + 1;
      continue;
    }

    const closeEnd = closeIdx + tagName.length + 3;
    const innerContent = content.slice(openStart + tagName.length + 2, closeIdx);
    children.push({ tagName, openStart, closeIdx, innerContent });
    pos = closeEnd;
  }

  return children;
}

/**
 * Get text content before the first child tag in content.
 */
function textBeforeFirstTag(content, firstChildStart) {
  if (firstChildStart === undefined || firstChildStart < 0) return content.trim();
  return content.slice(0, firstChildStart).trim();
}

/**
 * Get text content after the last child tag (for content that follows nested tags).
 */
function textAfterLastTag(content, lastChildCloseEnd) {
  if (lastChildCloseEnd === undefined || lastChildCloseEnd < 0) return '';
  const tail = content.slice(lastChildCloseEnd).trim();
  return tail;
}

/**
 * Parse one level: find all top-level tags in text and build section nodes.
 */
function parseLevel(text) {
  const sections = [];
  const children = extractDirectChildTags(text);

  for (const ch of children) {
    const firstNested = extractDirectChildTags(ch.innerContent);
    const firstChildStart = firstNested.length > 0 ? firstNested[0].openStart : -1;
    const lastChildCloseEnd = firstNested.length > 0
      ? firstNested[firstNested.length - 1].closeIdx + firstNested[firstNested.length - 1].tagName.length + 3
      : -1;

    const beforeText = textBeforeFirstTag(ch.innerContent, firstChildStart);
    const afterText = textAfterLastTag(ch.innerContent, lastChildCloseEnd);
    const content = [beforeText, afterText].filter(Boolean).join('\n\n');

    const childNodes = firstNested.length > 0 ? parseLevel(ch.innerContent) : [];

    sections.push({
      tagName: ch.tagName,
      label: humanize(ch.tagName),
      content: content || '',
      children: childNodes,
    });
  }

  return sections;
}

/**
 * Parse raw prompt string into a tree of sections.
 * If wrapped in <root>...</root>, only the inner content is parsed.
 *
 * @param {string} rawText - Raw prompt with XML tags
 * @returns {Array<{ tagName: string, label: string, content: string, children: Array }>}
 */
export function parsePrompts(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  let text = rawText.trim();
  const rootMatch = text.match(/^<root>\s*([\s\S]*)\s*<\/root>\s*$/);
  if (rootMatch) {
    text = rootMatch[1].trim();
  }

  return parseLevel(text);
}
