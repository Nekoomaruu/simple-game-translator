const { SHOW_TEXT, SHOW_TEXT_MULTILINE } = require('./eventCodes');
const { smartSplitTranslatedText } = require('./smartWrap');

const MAX_MERGED_LENGTH = 4900;

function collectShowTextGroup(eventList, startIndex, targetCode) {
  const group = [];
  let cursor = startIndex;

  while (cursor < eventList.length) {
    const command = eventList[cursor];
    if (!command || command.code !== targetCode) break;

    const params = command.parameters || [];
    const firstParam = params[0];
    if (typeof firstParam !== 'string' || !firstParam.trim()) break;

    group.push({ index: cursor, text: firstParam });
    cursor += 1;
  }

  return { group, endIndex: cursor };
}

async function processEventListWithMerging(eventList, { translateOne, maxCharsPerLine, joinWithoutSpace }) {
  let i = 0;

  while (i < eventList.length) {
    const command = eventList[i];
    const isShowText = command && (command.code === SHOW_TEXT || command.code === SHOW_TEXT_MULTILINE);

    if (!isShowText) {
      i += 1;
      continue;
    }

    const targetCode = command.code;
    const indent = command.indent || 0;
    const { group, endIndex } = collectShowTextGroup(eventList, i, targetCode);

    if (group.length === 0) {
      i += 1;
      continue;
    }

    const joiner = joinWithoutSpace ? '' : ' ';
    const combinedText = group.map((entry) => entry.text).join(joiner);

    if (combinedText.length > MAX_MERGED_LENGTH) {
      for (const entry of group) {
        eventList[entry.index].parameters[0] = await translateOne(entry.text);
      }
      i = endIndex;
      continue;
    }

    const translated = await translateOne(combinedText);
    const wrappedLines = smartSplitTranslatedText(translated, maxCharsPerLine);

    for (let idx = 0; idx < group.length; idx += 1) {
      eventList[group[idx].index].parameters[0] = idx < wrappedLines.length ? wrappedLines[idx] : '';
    }

    if (wrappedLines.length > group.length) {
      let insertPos = endIndex;
      for (const extraLine of wrappedLines.slice(group.length)) {
        eventList.splice(insertPos, 0, {
          code: targetCode,
          indent,
          parameters: [extraLine]
        });
        insertPos += 1;
      }
      i = insertPos;
    } else {
      i = endIndex;
    }
  }
}

module.exports = { processEventListWithMerging };
        
