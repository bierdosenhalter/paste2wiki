(function () {
    'use strict';

    // MediaWiki syntax converters
    const mediawikiConverters = [
        {
            filter: 'h1',
            replacement: function (content) {
                return '\n= ' + content + ' =\n';
            }
        },

        {
            filter: 'h2',
            replacement: function (content) {
                return '\n== ' + content + ' ==\n';
            }
        },

        {
            filter: 'h3',
            replacement: function (content) {
                return '\n=== ' + content + ' ===\n';
            }
        },

        {
            filter: 'h4',
            replacement: function (content) {
                return '\n==== ' + content + ' ====\n';
            }
        },

        {
            filter: 'h5',
            replacement: function (content) {
                return '\n===== ' + content + ' =====\n';
            }
        },

        {
            filter: 'h6',
            replacement: function (content) {
                return '\n====== ' + content + ' ======\n';
            }
        },

        {
            filter: 'sup',
            replacement: function (content) {
                return '<sup>' + content + '</sup>';
            }
        },

        {
            filter: 'sub',
            replacement: function (content) {
                return '<sub>' + content + '</sub>';
            }
        },

        {
            filter: 'br',
            replacement: function () {
                return '<br />';
            }
        },

        {
            filter: 'hr',
            replacement: function () {
                return '\n----\n';
            }
        },

        {
            filter: ['em', 'i', 'cite', 'var'],
            replacement: function (content) {
                return "''" + content + "''";
            }
        },

        {
            filter: ['strong', 'b'],
            replacement: function (content) {
                return "'''" + content + "'''";
            }
        },

        {
            filter: ['ins', 'u'],
            replacement: function (content) {
                return '<ins>' + content + '</ins>';
            }
        },

        {
            filter: ['del', 's'],
            replacement: function (content) {
                return '<del>' + content + '</del>';
            }
        },

        {
            filter: function (node) {
                const hasSiblings = node.previousSibling || node.nextSibling;
                const isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
                const isCodeElem = node.nodeName === 'CODE' ||
                    node.nodeName === 'KBD' ||
                    node.nodeName === 'SAMP' ||
                    node.nodeName === 'TT';

                return isCodeElem && !isCodeBlock;
            },
            replacement: function (content) {
                return '<code>' + content + '</code>';
            }
        },

        {
            filter: function (node) {
                return node.nodeName === 'A' && node.getAttribute('href');
            },
            replacement: function (content, node) {
                const url = node.getAttribute('href');

                // Check if it's likely an internal link (simple heuristic)
                const isInternal = !url.match(/^(https?:|www\.|ftp:)/i) ||
                    url.includes('wiki') ||
                    url.startsWith('/');

                if (isInternal) {
                    // Internal link - use [[PageName]] or [[PageName|Display text]]
                    if (!content || content === url) {
                        return '[[' + url + ']]';
                    } else {
                        return '[[' + url + '|' + content + ']]';
                    }
                } else {
                    // External link - use [url text]
                    if (!content || content === url) {
                        return '[' + url + ']';
                    } else {
                        return '[' + url + ' ' + content + ']';
                    }
                }
            }
        },

        {
            filter: 'img',
            replacement: function (content, node) {
                const src = node.getAttribute('src') || '';
                const alt = node.alt || '';
                const title = node.title || '';
                const width = node.getAttribute('width') || '';
                const height = node.getAttribute('height') || '';

                const params = [];
                if (alt) params.push('alt=' + alt);
                if (title) params.push('title=' + title);
                if (width) params.push('width=' + width);
                if (height) params.push('height=' + height);

                const paramStr = params.length ? '|' + params.join('|') : '';

                return src ? '[[File:' + src + paramStr + ']]' : '';
            }
        },

        {
            filter: 'li',
            replacement: function (content, node) {
                content = content.replace(/^\s+/, '').replace(/\n\s*/gm, '\n');

                // Calculate nesting level
                let level = 0;
                let parent = node.parentNode;

                while (parent && parent.nodeName) {
                    const parentName = parent.nodeName.toLowerCase();
                    if (parentName === 'ul' || parentName === 'ol') {
                        level++;
                    }
                    parent = parent.parentNode;
                }

                const prefix = '*'.repeat(level);

                // Handle nested content properly
                const lines = content.split('\n');
                const result = [];

                for (let i = 0; i < lines.length; i++) {
                    if (i === 0) {
                        result.push(prefix + ' ' + lines[i]);
                    } else if (lines[i].trim()) {
                        // For subsequent lines in the same list item, indent them
                        result.push(lines[i]);
                    }
                }

                // Ensure proper line breaks between list items
                return result.join('\n');
            }
        },

        {
            filter: ['ul', 'ol'],
            replacement: function (content, node) {
                const strings = [];

                for (let i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i]._replacement) {
                        strings.push(node.childNodes[i]._replacement);
                    }
                }

                return '\n' + strings.join('\n');
            }
        },

        {
            filter: 'blockquote',
            replacement: function (content) {
                content = content.trim()
                content = content.replace(/\n{3,}/g, '\n')
                content = content.replace(/^/gm, '> ')
                return '\n' + content + '\n'
            }
        },

        {
            filter: function (node) {
                // Handle definition lists that contain list items
                return node.nodeName === 'DD' &&
                    node.parentNode &&
                    node.parentNode.nodeName === 'DL' &&
                    node.previousSibling &&
                    node.previousSibling.nodeName === 'DT' &&
                    node.previousSibling.querySelector('li');
            },
            replacement: function (content, node) {
                content = content.replace(/^\s+/, '');
                // Check if this should be a bulleted definition (:*)
                const prevDt = node.previousSibling;
                if (prevDt && prevDt.querySelector('li')) {
                    return ':*' + content + '\n';
                }
                return ':' + content + '\n';
            }
        },

        {
            filter: 'dl',
            replacement: function (content) {
                return '\n' + content;
            }
        },

        {
            filter: 'dt',
            replacement: function (content) {
                return '; ' + content + '\n';
            }
        },

        {
            filter: 'dd',
            replacement: function (content, node) {
                // Remove space between : and - for proper definition syntax
                content = content.replace(/^\s+/, '');

                // Check if we're in a context that should use :* instead of :-
                const prevSibling = node.previousSibling;

                if (prevSibling && prevSibling.nodeName === 'DT') {
                    const dtContent = prevSibling.textContent || '';
                    // If the DT ends with a list item, use :*
                    if (dtContent.trim().endsWith('*')) {
                        return ':*' + content + '\n';
                    }
                }

                return ':' + content + '\n';
            }
        },

        {
            filter: 'table',
            replacement: function (content, node) {
                const className = node.className || '';
                const isSortable = className.includes('sortable');
                const tableClass = isSortable ? 'wikitable sortable' : 'wikitable';
                return '\n{| class="' + tableClass + '"\n' + content + '\n|}\n';
            }
        },

        {
            filter: 'tr',
            replacement: function (content) {
                return '|-\n' + content;
            }
        },

        {
            filter: ['th', 'td'],
            replacement: function (content, node) {
                const colspan = node.getAttribute('colspan') || '';
                const rowspan = node.getAttribute('rowspan') || '';
                const style = node.getAttribute('style') || '';

                const attrs = [];
                if (colspan && colspan !== '1') attrs.push('colspan=' + colspan);
                if (rowspan && rowspan !== '1') attrs.push('rowspan=' + rowspan);

                // Handle basic styling
                if (style.includes('text-align:center')) attrs.push('align=center');
                if (style.includes('text-align:right')) attrs.push('align=right');
                if (style.includes('text-align:left')) attrs.push('align=left');

                const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

                const prefix = node.nodeName.toLowerCase() === 'th' ? '!' : '|';
                return prefix + attrStr + ' | ' + content + '\n';
            }
        },

        {
            filter: 'pre',
            replacement: function (content, node) {
                // Check if it's a code block within pre
                const isCode = node.firstChild && (
                    node.firstChild.nodeName === 'CODE' ||
                    node.className.includes('code') ||
                    node.className.includes('source')
                );

                if (isCode) {
                    return '<syntaxhighlight>\n' + content + '\n</syntaxhighlight>\n';
                } else {
                    return '<pre>\n' + content + '\n</pre>\n';
                }
            }
        },

        {
            filter: 'q',
            replacement: function (content) {
                return '<q>' + content + '</q>';
            }
        },

        {
            filter: function (node) {
                return node.nodeType === 8; // Comment node
            },
            replacement: function (content, node) {
                return '<!-- ' + node.nodeValue + ' -->';
            }
        }
    ];

    const escape = function (str) {
        return str
            // Remove archive.org URLs with timestamps
            .replace(/https:\/\/web\.archive\.org\/web\/\d+[im_]*\//g, '')
            // Remove *.fandom.com/wiki/ prefix
            .replace(/https:\/\/\w+\.fandom\.com\/wiki\//g, '')
            // Remove *.miraheze.org/wiki/ prefix
            .replace(/https:\/\/\w+\.miraheze\.org\/wiki\//g, '')
            // Remove *.wikipedia.org/wiki/ prefix
            .replace(/https:\/\/\w+\.wikipedia\.org\/wiki\//g, '')
            // Smart punctuation
            .replace(/[\u2018\u2019\u00b4]/g, "'")
            .replace(/[\u201c\u201d\u2033]/g, '"')
            .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
            .replace(/[\u2013\u2015]/g, '--')
            .replace(/\u2014/g, '---')
            .replace(/\u2026/g, '...')
            // Clean up whitespace - more aggressive
            .replace(/ +\n/g, '\n')
            .replace(/\n\s*\n\s*\n/g, '\n\n')  // Reduce multiple blank lines
            .replace(/\n\n+/g, '\n\n')         // Max 1 blank line
            .replace(/ +$/gm, '')              // Remove trailing spaces
    };

    const convert = function (str) {
        return escape(toMarkdown(str, {
            converters: mediawikiConverters,
            gfm: false
        }));
    };

    const insert = function (myField, myValue) {
        if (myField.selectionStart !== undefined) {
            const startPos = myField.selectionStart;
            const endPos = myField.selectionEnd;
            const beforeValue = myField.value.substring(0, startPos);
            const afterValue = myField.value.substring(endPos, myField.value.length);

            myField.value = beforeValue + myValue + afterValue;
            myField.selectionStart = startPos + myValue.length;
            myField.selectionEnd = startPos + myValue.length;
        } else {
            // Fallback for very old browsers
            myField.value += myValue;
        }

        myField.focus();
    };

    // http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
    document.addEventListener('DOMContentLoaded', function () {
        const info = document.querySelector('#info');
        const pastebin = document.querySelector('#pastebin');
        const output = document.querySelector('#output');
        const wrapper = document.querySelector('#wrapper');

        document.addEventListener('keydown', function (event) {
            if (event.ctrlKey || event.metaKey) {
                if (event.key.toLowerCase() === 'v') {
                    pastebin.innerHTML = '';
                    pastebin.focus();
                    info.classList.add('hidden');
                    wrapper.classList.add('hidden');
                }
            }
        });

        pastebin.addEventListener('paste', function () {
            setTimeout(function () {
                const html = pastebin.innerHTML;
                const mediawiki = convert(html);
                insert(output, mediawiki);
                wrapper.classList.remove('hidden');
                output.focus();
                output.select();
            }, 200);
        });
    });
})();