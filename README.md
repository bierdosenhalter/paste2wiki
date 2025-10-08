paste2wiki
==========

> Easily convert richly formatted text or HTML to
> [MediaWiki syntax](https://www.mediawiki.org/wiki/Markup_spec).
> Use the clipboard and paste to MediaWiki with a single keypress.
>
> The conversion is carried out by
> [to-markdown](https://github.com/domchristie/to-markdown),
> a Markdown converter running in the browser.

Demo
----

### Interactive

<https://bierdosenhalter.github.io/paste2wiki/>

### Video

![Screencast](screencast.gif)

Usage
-----

Open [index.html](index.html) in a favorite browser and hit `Ctrl+C`
(or `⌘+C` on Mac).

To copy the converted MediaWiki syntax to the clipboard, press `Ctrl+A`
followed by `Ctrl+C` (or `⌘+A` and `⌘+C` on Mac).

One can paste multiple times. This overwrites the previous conversion.

About
-----

[paste2wiki](https://github.com/bierdosenhalter/paste2wiki)
was forked from [clipboard2markdown](https://github.com/euangoddard/clipboard2markdown)
created by [Euan Goddard](https://github.com/euangoddard).
The original version used
[html2markdown](https://github.com/kates/html2markdown) by
[Kates Gasis](https://github.com/kates) and
[Himanshu Gilani](https://github.com/hgilani).
[Vegard Øye](https://github.com/epsil) ported it to
[to-markdown](https://github.com/domchristie/to-markdown) by
[Dom Christie](https://github.com/domchristie). The HTML template
is based on [Bootstrap](http://getbootstrap.com/).

This version transforms the project to convert rich-text content
to MediaWiki syntax instead of Markdown, making it easier to
paste formatted content into MediaWiki-based platforms like Wikipedia.

### License

[![License][license-image]][license-url]

Released under the MIT License. See the [LICENSE](LICENSE) file
for details.

[license-image]: https://img.shields.io/npm/l/markdownlint.svg
[license-url]: http://opensource.org/licenses/MIT

