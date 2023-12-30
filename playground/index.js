/**
 * Runs after monaco-editor library is loaded.
 * Prepare model.
 * Create editor.
 * Configure the typescript language server.
 */
async function init() {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    allowNonTsExtensions: true,
  });

  // FIXME: auto-detect all types
  const types = ["index.d.ts", "couch-api.d.ts", "types.d.ts", "post-query.d.ts"];
  (await Promise.all(types.map(async (dts) => {
    const req = await fetch(`./types/${dts}`);
    const content = await req.text();
    return [content, `file:///node_modules/@types/irclog-api/${dts}`]
  })))
  .forEach(([content, path]) => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(content, path);
  });

  let exampleCode = localStorage.getItem("example.ts");
  if (!exampleCode) {
    const req = await fetch('./example.ts');
    exampleCode = await req.text();
  }
  const uri = monaco.Uri.parse('file:///example.ts');
  const model = monaco.editor.createModel(exampleCode, 'typescript', uri);

  const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
    model: model,
    theme: 'vs-light',
    automaticLayout: true,
  });
  editor.focus();
  // make it global for debugging
  window.monacoEditor = editor;

  const debouncedSave = debounce(() => save(editor), 5000);
  editor.onKeyDown((ev) => {
    if (ev.keyCode === 49 /** KeyCode.KeyS */ && ev.ctrlKey) {
      ev.preventDefault();
      save(editor);
    } else {
      debouncedSave()
    }
  });

  document.getElementById('run-code').addEventListener('click', () => runCode(editor));
}

function save(editor) {
  localStorage.setItem("example.ts", editor.getModel().getValue());
}

/**
 * Run button handler
 *
 * @param {MonacoEditor} editor
 */
function runCode(editor) {
  const code = editor.getValue();
  const outputElement = document.querySelector('#console-output');

  try {
    const result = ts.transpileModule(code, {
      compilerOptions: { target: 'es2022', module: 'es2022', },
      reportDiagnostics: true,
    });
    const transpiledCode = result.outputText
      .replace(/^[:space:]*import.*from.*irclog-api.*/, `import {CouchDB} from "./dist/index.js"`)

    createModule(transpiledCode, '#console-output');

    outputElement.innerText = 'Code executed successfully';
  } catch (error) {
    outputElement.innerText += `Error: ${error.message}\n`;
  }
  outputElement.scrollTo({ top: outputElement.scrollHeight });
}

/**
 * Poor mans sandbox/eval implementation.
 *
 * Create a <script> element, type: module, and insert it into the dom, so it runs.
 *
 * Redirects console.log output to the html element given with consoleSelector query selector.
 *
 * @param {string} code
 * @param {string} consoleSelector
 */
function createModule(code, consoleSelector) {
  const oldModule = document.getElementById('run-module');
  const newModule = document.createElement('script');
  newModule.id = 'run-module';
  newModule.type = 'module';
  // redirect console.log to the html element
  newModule.textContent = `
    const console = { log: (msg) => {
      const el = document.querySelector('${consoleSelector}');
      el.innerText += msg + '\n';
      el.scrollTo({top: el.scrollHeight});
    }}
  `;
  newModule.textContent += code;
  if (oldModule) {
    document.body.replaceChild(newModule, oldModule);
  } else {
    document.body.appendChild(newModule);
  }
}

// Load the Monaco Editor
require.config({
  paths: {
    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs',
    // 'irclog-api': './dist/index.js',
  }
});

require(['vs/editor/editor.main'], function () {
  init();
});

/**
 * Live-reload assuming `location.hostname == 'localhost'` means this runs with esbuild
 *
 * https://esbuild.github.io/api/#live-reload
 */
if (window.location.hostname == 'localhost') {
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

/**
 * poor-mans debounce
 *
 * @param {()=>void} callback
 * @param {number} delay
 * @returns ()=>void
 */
function debounce(callback, delay) {
  let timer;
  return function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delay);
  }
}
