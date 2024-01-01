# Playground implementation notes

## monaco-editor

The playground is based on the [monaco-editor](https://microsoft.github.io/monaco-editor/) and
it runs completely in the browser - no backend is needed. That makes it work on a site hosted
at Github Pages too.

Monaco-editor is used since it is a decent editor, has built-in support for javascript and typescript,
and runs in the browser.

The playground code is written in plain javascript and html.

> [!NOTE]
> Don't be fooled by the playground at https://www.typescriptlang.org/dev/sandbox/.
> Its documentation is incomplete, and installs quite old monaco-editor and typescript.


## type support in the editor

In order for monaco-editor to be aware about the types of our project, we need to build a bundled
`.d.ts` files. `tsc` itself doesn't know to properly bundle a `.d.ts` file useful for monaco-editor,
so had to use `dts-bundle` (see `playground:types` in package.json scripts).

The bundle is created at `playground/dist/index.d.ts`, loaded in the browser with `fetch` and
then loaded in the typescript server with `addExtraLib`, at a virtual path of
`file:///node_modules/@types/@irclogs/api/index.d.ts`.

Given that the edited content is virtually at `file:///example.ts`, the language server uses the node
module resolution algorithm, by looking for `node_modules`, then `@types/<your library>` etc.

ps.
there's an option to load each `.d.ts` file separately as created by `tsc`, and add them to the language
server. But that's a bit tedious and the list of files will need to be kept in sync with what `tsc` creates
from the source.


## running code in the browser

I wanted to enable running code in the browser as you would run it in any normal typescript module. That
includes top-level await and support for the `import` statement. For those reasons `eval` is not possible.

In order to actually run the code, first we call `getEmitOutput` on the editor to get transpiled typescript
to javascript. Then we create a `<script>` dom element, with `type=module`, and set the transpiled code
as it's content. Once the element is added to the DOM, the javascript code will run.

### import mapping

[importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) is used to
map the normal `import {} from "@irclogs/api"` usage, to actually load the module from a file via http.

esbuild was used to create the `esm` bundle in `playground/dist/index.js`, so that it's compatible with
the new-wave javascript module system (`import`).


### redirecting console.log

A preamble is added to the transpiled code to override `console.log` to actually add text into the
`#console-output` html element (a `<pre>` element). Seems hacky, but it works.



## Re-use of the playground

There's really only 3 places to change `@irclogs/api` in the playground code:
- in `example.ts` of-course
- in the `importmap` in `index.html`
- the virtual path `file:///node_modules/@types/@irclogs/api/index.d.ts` in the playground.js

and one in `package.json` when building the bundled `index.d.ts` file with dts-bundle `--name @irclogs/api`.
