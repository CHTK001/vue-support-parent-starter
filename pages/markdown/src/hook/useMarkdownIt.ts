import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItToc from 'markdown-it-toc-done-right';
import markdownItHighlightjs from 'markdown-it-highlightjs';
import markdownItTaskLists from 'markdown-it-task-lists';
import markdownItKatex from '@traptitech/markdown-it-katex';
import markdownItSub from 'markdown-it-sub';
import markdownItSup from 'markdown-it-sup';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItMark from 'markdown-it-mark';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItAbbr from 'markdown-it-abbr';
import markdownItContainer from 'markdown-it-container';

export default function useMarkdownIt() {
  // 创建markdown-it实例
  const md = new MarkdownIt({
    html: true,
    xhtmlOut: true,
    breaks: true,
    linkify: true,
    typographer: true,
  });

  // 配置插件
  md.use(markdownItAnchor, {
    permalink: true,
    permalinkBefore: true,
    permalinkSymbol: '#',
    permalinkClass: 'header-anchor',
  })
    .use(markdownItToc, {
      containerClass: 'table-of-contents',
      listType: 'ul',
    })
    .use(markdownItHighlightjs)
    .use(markdownItTaskLists, { enabled: true, label: true, labelAfter: true })
    .use(markdownItKatex)
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItFootnote)
    .use(markdownItMark)
    .use(markdownItDeflist)
    .use(markdownItAbbr)
    .use(markdownItContainer, 'info')
    .use(markdownItContainer, 'success')
    .use(markdownItContainer, 'warning')
    .use(markdownItContainer, 'danger');

  // 自定义渲染规则
  const defaultLinkRenderer = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    // 为链接添加target="_blank"和rel="noopener noreferrer"
    const token = tokens[idx];
    const aIndex = token.attrIndex('target');
    
    if (aIndex < 0) {
      token.attrPush(['target', '_blank']);
      token.attrPush(['rel', 'noopener noreferrer']);
    }
    
    return defaultLinkRenderer(tokens, idx, options, env, self);
  };

  return md;
}