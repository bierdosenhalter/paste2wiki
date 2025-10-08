(function() {
    'use strict';

    // MediaWiki syntax converters
    var mediawikiConverters = [{
            filter: 'h1',
            replacement: function(content, node) {
                return '\n= ' + content + ' =\n';
            }
        },

        {
            filter: 'h2',
            replacement: function(content, node) {
                return '\n== ' + content + ' ==\n';
            }
        },

        {
            filter: 'h3',
            replacement: function(content, node) {
                return '\n=== ' + content + ' ===\n';
            }
        },

        {
            filter: 'h4',
            replacement: function(content, node) {
                return '\n==== ' + content + ' ====\n';
            }
        },

        {
            filter: 'h5',
            replacement: function(content, node) {
                return '\n===== ' + content + ' =====\n';
            }
        },

        {
            filter: 'h6',
            replacement: function(content, node) {
                return '\n====== ' + content + ' ======\n';
            }
        },

        {
            filter: 'sup',
            replacement: function(content) {
                return '<sup>' + content + '</sup>';
            }
        },

        {
            filter: 'sub',
            replacement: function(content) {
                return '<sub>' + content + '</sub>';
            }
        },

        {
            filter: 'br',
            replacement: function() {
                return '<br />\n';
            }
        },

        {
            filter: 'hr',
            replacement: function() {
                return '\n----\n';
            }
        },

        {
            filter: ['em', 'i', 'cite', 'var'],
            replacement: function(content) {
                return "''" + content + "''";
            }
        },

        {
            filter: ['strong', 'b'],
            replacement: function(content) {
                return "'''" + content + "'''";
            }
        },

        {
            filter: ['ins', 'u'],
            replacement: function(content) {
                return '<ins>' + content + '</ins>';
            }
        },

        {
            filter: ['del', 's'],
            replacement: function(content) {
                return '<del>' + content + '</del>';
            }
        },

        {
            filter: function(node) {
                var hasSiblings = node.previousSibling || node.nextSibling;
                var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;
                var isCodeElem = node.nodeName === 'CODE' ||
                    node.nodeName === 'KBD' ||
                    node.nodeName === 'SAMP' ||
                    node.nodeName === 'TT';

                return isCodeElem && !isCodeBlock;
            },
            replacement: function(content) {
                return '<code>' + content + '</code>';
            }
        },

        {
            filter: function(node) {
                return node.nodeName === 'A' && node.getAttribute('href');
            },
            replacement: function(content, node) {
                var url = node.getAttribute('href');
                // Check if it's likely an internal link (simple heuristic)
                var isInternal = !url.match(/^(https?:|www\.|ftp:)/i) ||
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
            replacement: function(content, node) {
                var src = node.getAttribute('src') || '';
                var alt = node.alt || '';
                var title = node.title || '';
                var width = node.getAttribute('width') || '';
                var height = node.getAttribute('height') || '';

                var params = [];
                if (alt) params.push('alt=' + alt);
                if (title) params.push('title=' + title);
                if (width) params.push('width=' + width);
                if (height) params.push('height=' + height);

                var paramStr = params.length ? '|' + params.join('|') : '';

                return src ? '[[File:' + src + paramStr + ']]' : '';
            }
        },

        {
            filter: 'li',
            replacement: function(content, node) {
                content = content.replace(/^\s+/, '').replace(/\n/gm, '\n  ');
                var parent = node.parentNode;
                var index = Array.prototype.indexOf.call(parent.children, node) + 1;

                // Count nesting level for proper asterisks
                var level = 1;
                var currentParent = parent;
                while (currentParent.parentNode && /ul|ol/i.test(currentParent.parentNode.nodeName)) {
                    level++;
                    currentParent = currentParent.parentNode;
                }

                var prefix = '*'.repeat(level);
                return prefix + ' ' + content;
            }
        },

        {
            filter: ['ul', 'ol'],
            replacement: function(content, node) {
                var strings = [];
                for (var i = 0; i < node.childNodes.length; i++) {
                    if (node.childNodes[i]._replacement) {
                        strings.push(node.childNodes[i]._replacement);
                    }
                }

                // Handle nested lists
                if (/li/i.test(node.parentNode.nodeName)) {
                    return strings.join('\n');
                }
                return '\n' + strings.join('\n') + '\n';
            }
        },

        {
            filter: 'blockquote',
            replacement: function(content) {
                content = content.trim()
                content = content.replace(/\n{3,}/g, '\n')
                content = content.replace(/^/gm, '> ')
                return '\n' + content + '\n'
            }
        },

        {
            filter: 'dl',
            replacement: function(content, node) {
                return '\n' + content + '\n';
            }
        },

        {
            filter: 'dt',
            replacement: function(content, node) {
                return '; ' + content + '\n';
            }
        },

        {
            filter: 'dd',
            replacement: function(content, node) {
                return ': ' + content + '\n';
            }
        },

        {
            filter: 'table',
            replacement: function(content, node) {
                var className = node.className || '';
                var isSortable = className.includes('sortable');
                var tableClass = isSortable ? 'wikitable sortable' : 'wikitable';
                return '\n{| class="' + tableClass + '"\n' + content + '\n|}\n';
            }
        },

        {
            filter: 'tr',
            replacement: function(content, node) {
                return '|-\n' + content;
            }
        },

        {
            filter: ['th', 'td'],
            replacement: function(content, node) {
                var colspan = node.getAttribute('colspan') || '';
                var rowspan = node.getAttribute('rowspan') || '';
                var style = node.getAttribute('style') || '';

                var attrs = [];
                if (colspan && colspan !== '1') attrs.push('colspan=' + colspan);
                if (rowspan && rowspan !== '1') attrs.push('rowspan=' + rowspan);

                // Handle basic styling
                if (style.includes('text-align:center')) attrs.push('align=center');
                if (style.includes('text-align:right')) attrs.push('align=right');
                if (style.includes('text-align:left')) attrs.push('align=left');

                var attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

                var prefix = node.nodeName.toLowerCase() === 'th' ? '!' : '|';
                return prefix + attrStr + ' | ' + content + '\n';
            }
        },

        {
            filter: 'pre',
            replacement: function(content, node) {
                // Check if it's a code block within pre
                var isCode = node.firstChild && (
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
            replacement: function(content, node) {
                return '<q>' + content + '</q>';
            }
        },

        {
            filter: function(node) {
                return node.nodeType === 8; // Comment node
            },
            replacement: function(content, node) {
                return '<!-- ' + node.nodeValue + ' -->';
            }
        }
    ];

    var escape = function(str) {
        return str
            // Smart punctuation
            .replace(/[\u2018\u2019\u00b4]/g, "'")
            .replace(/[\u201c\u201d\u2033]/g, '"')
            .replace(/[\u2212\u2022\u00b7\u25aa]/g, '-')
            .replace(/[\u2013\u2015]/g, '--')
            .replace(/\u2014/g, '---')
            .replace(/\u2026/g, '...')
            // Clean up whitespace
            .replace(/[ ]+\n/g, '\n')
            .replace(/\s*\\\n/g, '\\\n')
            .replace(/\s*\\\n\s*\\\n/g, '\n\n')
            .replace(/\s*\\\n\n/g, '\n\n')
            .replace(/\n-\n/g, '\n')
            .replace(/\n\n\s*\\\n/g, '\n\n')
            .replace(/\n\n\n*/g, '\n\n')
            .replace(/[ ]+$/gm, '')
    };

    var convert = function(str) {
        return escape(toMarkdown(str, {
            converters: mediawikiConverters,
            gfm: false
        }));
    }

    var insert = function(myField, myValue) {
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            sel.text = myValue;
            sel.select()
        } else {
            if (myField.selectionStart || myField.selectionStart == "0") {
                var startPos = myField.selectionStart;
                var endPos = myField.selectionEnd;
                var beforeValue = myField.value.substring(0, startPos);
                var afterValue = myField.value.substring(endPos, myField.value.length);
                myField.value = beforeValue + myValue + afterValue;
                myField.selectionStart = startPos + myValue.length;
                myField.selectionEnd = startPos + myValue.length;
                myField.focus()
            } else {
                myField.value += myValue;
                myField.focus()
            }
        }
    };

    // http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
    document.addEventListener('DOMContentLoaded', function() {
        var info = document.querySelector('#info');
        var pastebin = document.querySelector('#pastebin');
        var output = document.querySelector('#output');
        var wrapper = document.querySelector('#wrapper');

        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey || event.metaKey) {
                if (String.fromCharCode(event.which).toLowerCase() === 'v') {
                    pastebin.innerHTML = '';
                    pastebin.focus();
                    info.classList.add('hidden');
                    wrapper.classList.add('hidden');
                }
            }
        });

        pastebin.addEventListener('paste', function() {
            setTimeout(function() {
                var html = pastebin.innerHTML;
                var mediawiki = convert(html);
                insert(output, mediawiki);
                wrapper.classList.remove('hidden');
                output.focus();
                output.select();
            }, 200);
        });
    });
})();