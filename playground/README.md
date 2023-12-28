# TODO

* load types in monaco-editor
* transpile to javascript (LSP?)
* load library in browser
* execute transpiled code
* redirect console.log to #console-output
* live-reload locally
- load other npm packages

# Api Playground

The api playground loads up monaco-editor and the types and code of the api libraries. Running it on localhost:8000 or
github …


# NOTES
```
esbuild src/index.ts --bundle --outdir=playground/dist --watch --servedir=playground

pnpm tsc --emitDeclarationOnly src/index.ts --declaration --target esnext --declarationDir playground/types
```
