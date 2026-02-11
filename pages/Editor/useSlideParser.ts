
import { useMemo } from 'react';
import { SlidePageInfo } from '../../types';

export const useSlideParser = (content: string): SlidePageInfo[] => {
  return useMemo((): SlidePageInfo[] => {
    const lines = content.split('\n');
    const blocks: { lines: string[], startLine: number, isSeparator: boolean }[] = [];
    
    let currentBlock: string[] = [];
    let currentBlockStartLine = 1;

    lines.forEach((line, idx) => {
      if (line.trim() === '---') {
        if (currentBlock.length > 0 || (idx === 0 && line.trim() === '---')) {
          blocks.push({ lines: currentBlock, startLine: currentBlockStartLine, isSeparator: false });
        }
        blocks.push({ lines: ['---'], startLine: idx + 1, isSeparator: true });
        currentBlock = [];
        currentBlockStartLine = idx + 2;
      } else {
        currentBlock.push(line);
      }
    });
    if (currentBlock.length > 0) {
      blocks.push({ lines: currentBlock, startLine: currentBlockStartLine, isSeparator: false });
    }

    const pages: SlidePageInfo[] = [];
    let i = 0;

    while (i < blocks.length) {
      const b = blocks[i];
      if (b.isSeparator && i + 1 < blocks.length && !blocks[i+1].isSeparator) {
        const potentialYaml = blocks[i+1];
        const isYaml = !potentialYaml.lines.some(l => l.trim().startsWith('#')) && potentialYaml.lines.some(l => l.includes(':'));
        
        if (isYaml && i + 2 < blocks.length && blocks[i+2].isSeparator) {
          const slideLineStart = b.startLine;
          let slideContentLines: string[] = [];
          let nextI = i + 3;
          while (nextI < blocks.length && !blocks[nextI].isSeparator) {
            slideContentLines.push(...blocks[nextI].lines);
            nextI++;
          }
          const fullContent = [...potentialYaml.lines, ...slideContentLines];
          let title = "";
          for (const line of fullContent) {
            if (line.trim().startsWith('#')) {
              title = line.trim().replace(/^#+\s+/, '');
              break;
            }
          }
          pages.push({
            index: pages.length + 1,
            title: title || `Slide ${pages.length + 1}`,
            preview: slideContentLines.find(l => l.trim().length > 0)?.slice(0, 40) || "Empty Slide",
            lineStart: slideLineStart
          });
          i = nextI;
          continue;
        }
      }

      if (!b.isSeparator && b.lines.length > 0) {
        let title = "";
        for (const line of b.lines) {
          if (line.trim().startsWith('#')) {
            title = line.trim().replace(/^#+\s+/, '');
            break;
          }
        }
        pages.push({
          index: pages.length + 1,
          title: title || `Slide ${pages.length + 1}`,
          preview: b.lines.find(l => l.trim().length > 0)?.slice(0, 40) || "Empty Slide",
          lineStart: b.startLine
        });
      }
      i++;
    }

    return pages.length > 0 ? pages : [{ index: 1, title: "Untitled", preview: "...", lineStart: 1 }];
  }, [content]);
};
