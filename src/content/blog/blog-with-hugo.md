---
title: Creating a blog With Hugo
date: 2020-08-22T15:04:11-07:00
description:
  An overview of how to use the Hugo static site generator (SSG) to
  write a blog.
---

**Note:**
Since this post was written, I have transitioned my site away from Hugo.
While the information here may still apply, it is likely outdated.

---

Web development can be tricky, especially if you want your site to look nice.
That's where [Hugo](https://gohugo.io) comes in.
Hugo is a static site generator (SSG).
It takes simple markdown files and converts them into web-ready HTML/CSS/JS using a theme you provide.

## Installing Hugo

Most Linux distributions already have a package for Hugo.
It can also be installed using Homebrew or Chocolatey.
If you don't use a package manager, binaries are available for Windows, MacOS, Linux, FreeBSD, and OpenBSD from the [Hugo releases page](https://github.com/gohugoio/hugo/releases).
Check out the [install guide](https://gohugo.io/getting-started/installing) for detailed instructions.

## Creating a site

Starting a site is easy. To create the Hugo directory structure in the current directory, run
```sh
hugo new site . -f yaml
```
You can choose between YAML, TOML, and JSON for your config file. Change the `-f` option accordingly.

This will create the following skeleton:
```sh
.
├── archetypes/
│   └── default.md
├── config.yaml
├── content/
├── data/
├── layouts/
├── static/
└── themes/

6 directories, 2 files
```

## Configuring the site

The `config.yaml` file is where your site's main configuration goes.
(If you used a different format, i.e. JSON or TOML, change the extension accordingly)

There are some basic options that apply to (almost) every Hugo site.
The theme you choose in the next step may have extra options to choose from.
For a list of all default options, [see here](https://gohugo.io/getting-started/configuration/#all-configuration-settings).

Here's the `config.yaml` file for this site:
```yaml linenos=inline
baseURL: https://kasad.com/blog/
languageCode: en-us
title: .tar.gz
author: Kian Kasad
theme: paper

enableEmoji: true
enableGitInfo: true
enableRobotsTXT: true
```

`baseURL`: The URL where your site will be published  
`languageCode`: the default site language  
`title`: The title of the entire site  
`author`: The site author. Multiple can be specified.  
`theme`: Theme to use (see next step).  
`enableEmoji`: Whether to convert emoji codes to emojis (e.g. `:smi​le:` &rarr; :smile:)  
`enableGitInfo`: For hugo sites versioned with Git, use the commit date as the 'last modified' time for each page.  
`enableRobotsTXT`: Generate a `robots.txt` file.

## Choosing a theme

You could style your site by hand, but by far the easiest way is to choose a theme.
There's a [comprehensive list](https://themes.gohugo.io) maintained on the Hugo website.
This site uses the [Paper](https://github.com/nanxiaobei/hugo-paper) theme by 南小北.

Once you find the theme you want, place it into the `themes` folder.

> If you are using Git to version your Hugo site, you can include your theme as a [submodule](/blog/2020/08/22/blog-with-hugo).

To use the theme in your site, set the `theme` key in your configuration file.
For example, if your theme is located in `themes/my-sweet-theme`, your config file would contain this line:
```yaml
theme: my-sweet-theme
```

Be sure to check if your theme has any extra options to configure.

## Adding content

Page content goes in the `content` folder.
Hugo makes it easy to create a new page:
```sh
hugo new article.md
```

This will create `content/article.md`.
If you take a look in the file you'll notice a header with some variables.
This is called 'front matter'.
[See here](https://gohugo.io/content-management/front-matter) for a more complete guide.

A basic page will have something like the following:
```yaml
---
title: "Article Title Here"
author: Author Name
date: 2020-08-22T16:06:07-07:00
draft: true
---
```

`title`, `author`, and `date` are self-explanatory, but `draft` is a bit more complicated.
It controls whether the page gets published in the final site.
Drafts are not included by default when compiling/generating or serving (next step) your page, although that can be changed using some command-line options.
Set `draft` to `false` when you're done editing a page to ensure it gets published.

Add some filler text below the front matter. We'll come back to the content later, but for now, let's turn this into a website.

## Serving your website locally for testing

Now that you have a basic page set up, it's time to transform it into a website:
```sh
hugo server -D
```
will start a web server on port 1313.
The `-D` option tells it to include drafts.
This is useful for testing.

Running this will output a URL that you can visit in your browser.

I recommend using a multiplexer like [tmux](https://github.com/tmux/tmux/wiki) to run your Hugo server when testing. This way you can leave the server running in the background.
The Hugo server will automatically update when pages, themes, templates, or configuration files are changed, so leaving it running while editing pages is really handy.

## A note on page locations

As you may have noticed, Hugo created a home page, which is a type of list page. Even though you didn't tell it to, it creates one for the `content` folder and all immediate children.

Your `article.md` file became `<server url>/article/`.
You can set the `uglyurls` option to `true` in your config file, which will change the behaviour and create `<server url>/article.html` instead.

You can create subfolders inside of content, too. Try creating a page using
```sh
hugo new blog/post-1.md
```

This would end up as `<server url>/blog/post-1/` in the final website.
If you create more pages under `content/blog/` and then go to `<server url>/blog/`, you'll notice that it is a list page containing all the pages in the `blog` folder.

Hopefully you now have a basic understanding of content pages and list pages.

## Back to content

### Markdown vs HTML

You can choose to use markdown or HTML for your content. Markdown is easier, but HTML gives more control. However, markdown lets you embed HTML, so in my opinion, it's superior. This way you have both the ease of markdown and the control of HTML in a single file.

There are lots of tutorials on markdown, so I'll refer you to the [Hugo docs page](https://gohugo.io/content-management/formats/#learn-markdown) about it instead of explaining it here.

### Shortcodes

Hugo has another great feature called 'shortcodes.' These are like shortcuts you can put in your markdown files.
They make embedding content easier.
I'll go over two of them, but the full list is [located here](https://gohugo.io/content-management/shortcodes/).

#### Figure

A figure is some content (usually an image) and an optional caption.
To create a captioned image using Hugo, use this shortcode:
```md
{​{< figure src="/image.png" title="Caption text" >}}
```

Place `image.png` in the `static` folder, and you're all set.
Well, there's a catch. If your site is located at a path like `<server url>/blog/`, you'll have to account for that in your `src` field. So you'd end up with the following:

```md
{​{< figure src="/blog/image.png" title="Caption text" >}}
```

#### Highlight/code

It's super easy to include syntax-highlighted text, usually code, in a Hugo site. Just use the `highlight` shortcode:

```md
{​{< highlight java >}}
java_code_here();
{​{< /highlight >}}
```

As you can see, the second `highlight` shortcode is prefixed with a slash (`/`) to indicate that it closes a previous one, just like HTML tags.

# Generating the website

You could serve your website using `hugo server`, but you probably want to create static content.
Static content is what you're probably used to seeing in web development: HTML, CSS, JavaScript, images, etc.

To compile your website, run
```sh
hugo
```
If you want to include draft pages, add the `-D` flag.

This will put your compiled content in the `public` directory.
You change this by setting the `publishDir` option in your configuration file.

For example,
```yaml
publishDir: ../
```
will put the compiled content in the directory above your hugo directory.
I do this with my website, so I can have a `hugo` folder that gets ignored by the web server, while the content stays accessible in the parent directory.

-------------

Hopefully you now know how to create a basic hugo site. Be sure to read the [Hugo documentation](https://gohugo.io/documentation/), which covers everything you could wonder about Hugo.
I also recommend taking a look at the official [getting started guide](https://gohugo.io/categories/getting-started), which is slightly more in-depth than this guide.
