import { Fab } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Tooltip from "@mui/material/Tooltip";
import Editor, { OnMount } from "@monaco-editor/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type * as Monaco from "monaco-editor";

export type EditorThemeMode = "light" | "dark";

export type LintDiagnostic = {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity?: "error" | "warning" | "info" | "hint";
};

export type LintAdapter = (params: {
  value: string;
  model: Monaco.editor.ITextModel;
}) => Promise<LintDiagnostic[]> | LintDiagnostic[];

export type FormatAdapter = (params: {
  value: string;
  language: string;
}) => Promise<string> | string;

export type ContextEntry = {
  key: string;
  value: unknown;
  description?: string | null;
};

export type SchemaProperty = {
  name: string;
  type: string;
  description?: string | null;
};

export type SchemaClass = {
  name: string;
  tableName?: string;
  description?: string | null;
  properties: SchemaProperty[];
};

export type ReusableCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  onRun?: (value: string) => void;
  readOnly?: boolean;
  path?: string;
  language?: string;
  height?: string | number;
  minHeight?: number;
  maxHeight?: number;
  autoHeight?: boolean;
  themeMode?: EditorThemeMode;
  backgroundColor?: string;
  contentPaddingTop?: number;
  runButtonLabel?: React.ReactNode;
  lintAdapter?: LintAdapter;
  formatAdapter?: FormatAdapter;
  contextEntries?: ContextEntry[];
  schemaClasses?: SchemaClass[];
  showDiagnostics?: boolean;
};

const severityMap: Record<
  NonNullable<LintDiagnostic["severity"]>,
  Monaco.MarkerSeverity
> = {
  error: 8,
  warning: 4,
  info: 2,
  hint: 1,
};

const ctxCompletionRegistry = new Map<string, ContextEntry[]>();
const ctxProvidersRegistered = new Set<string>();

function ensureCompletionProvider(monaco: typeof Monaco, language: string) {
  if (ctxProvidersRegistered.has(language)) return;
  ctxProvidersRegistered.add(language);

  monaco.languages.registerCompletionItemProvider(language, {
    provideCompletionItems(model, position) {
      const entries = ctxCompletionRegistry.get(model.uri.toString()) ?? [];
      if (!entries.length) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      return {
        suggestions: entries.map((entry) => ({
          label: entry.key,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail:
            entry.value === null
              ? "context · populated at runtime"
              : `context · ${
                  typeof entry.value === "object"
                    ? JSON.stringify(entry.value)
                    : String(entry.value)
                }`,
          documentation: entry.description ?? undefined,
          insertText: entry.key,
          range,
          sortText: `0_${entry.key}`,
        })),
      };
    },
  });
}

const schemaRegistry = new Map<string, SchemaClass[]>();
const schemaProvidersRegistered = new Set<string>();

type ClassMethod = {
  name: string;
  signature: string;
  insertText: string;
  returns: "list" | "instance" | "scalar";
  doc: (cls: SchemaClass) => string;
};

const CLASS_METHODS: ClassMethod[] = [
  {
    name: "all",
    signature: "all()",
    insertText: "all()",
    returns: "list",
    doc: (cls) => `Every ${cls.name} record.`,
  },
  {
    name: "find",
    signature: "find(id)",
    insertText: "find(${1:id})",
    returns: "instance",
    doc: (cls) => `The ${cls.name} with the given id.`,
  },
  {
    name: "filter",
    signature: "filter(**criteria)",
    insertText: "filter(${1:field}=${2:value})",
    returns: "list",
    doc: (cls) => `${cls.name} records matching every given field.`,
  },
  {
    name: "first",
    signature: "first(**criteria)",
    insertText: "first(${1:field}=${2:value})",
    returns: "instance",
    doc: (cls) => `The first matching ${cls.name}, or None.`,
  },
  {
    name: "count",
    signature: "count(**criteria)",
    insertText: "count()",
    returns: "scalar",
    doc: (cls) => `How many ${cls.name} records match.`,
  },
];

type InferredType = { className: string; isList: boolean };

function inferVariableTypes(
  text: string,
  classes: SchemaClass[]
): Map<string, InferredType> {
  const byName = new Map(classes.map((cls) => [cls.name, cls]));
  const inferred = new Map<string, InferredType>();

  const assignment =
    /(?:^|\n)\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\.\s*([A-Za-z_]\w*)\s*\(/g;
  let match: RegExpExecArray | null;
  while ((match = assignment.exec(text)) !== null) {
    const [, variable, owner, method] = match;
    if (!byName.has(owner)) continue;
    const known = CLASS_METHODS.find((item) => item.name === method);
    if (!known || known.returns === "scalar") continue;
    inferred.set(variable, {
      className: owner,
      isList: known.returns === "list",
    });
  }

  const iteration = /\bfor\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_]\w*)/g;
  const alias = /(?:^|\n)\s*([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*(?:$|\n)/g;

  for (let pass = 0; pass < 3; pass += 1) {
    iteration.lastIndex = 0;
    while ((match = iteration.exec(text)) !== null) {
      const [, item, source] = match;
      const sourceType = byName.has(source)
        ? { className: source, isList: true }
        : inferred.get(source);
      if (!sourceType || !sourceType.isList) continue;
      inferred.set(item, { className: sourceType.className, isList: false });
    }

    alias.lastIndex = 0;
    while ((match = alias.exec(text)) !== null) {
      const [, target, source] = match;
      const sourceType = inferred.get(source);
      if (sourceType) inferred.set(target, sourceType);
    }
  }

  return inferred;
}

function propertyDoc(cls: SchemaClass): string {
  if (!cls.properties.length) return "_No columns yet._";
  return cls.properties
    .map((property) => `- \`${property.name}\`: ${property.type}`)
    .join("\n");
}

function classDoc(cls: SchemaClass): string {
  return [
    cls.description ? `${cls.description}\n` : "",
    cls.tableName ? `Generated from table \`${cls.tableName}\`.\n` : "",
    "**Properties**",
    propertyDoc(cls),
  ]
    .filter(Boolean)
    .join("\n");
}

function ensureSchemaProviders(monaco: typeof Monaco, language: string) {
  if (schemaProvidersRegistered.has(language)) return;
  schemaProvidersRegistered.add(language);

  monaco.languages.registerCompletionItemProvider(language, {
    triggerCharacters: ["."],
    provideCompletionItems(model, position) {
      const classes = schemaRegistry.get(model.uri.toString()) ?? [];
      if (!classes.length) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const linePrefix = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: word.startColumn,
      });
      const member = /([A-Za-z_]\w*)\s*\.\s*$/.exec(linePrefix);

      if (member) {
        const owner = member[1];
        const asClass = classes.find((cls) => cls.name === owner);

        if (asClass) {
          return {
            suggestions: [
              ...CLASS_METHODS.map((method) => ({
                label: method.signature,
                kind: monaco.languages.CompletionItemKind.Method,
                detail: `${asClass.name} · ${
                  method.returns === "list"
                    ? `list[${asClass.name}]`
                    : method.returns === "instance"
                    ? asClass.name
                    : "int"
                }`,
                documentation: { value: method.doc(asClass) },
                insertText: method.insertText,
                insertTextRules:
                  monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range,
                sortText: `0_${method.name}`,
              })),
              ...asClass.properties.map((property) => ({
                label: property.name,
                kind: monaco.languages.CompletionItemKind.Field,
                detail: `${asClass.name}.${property.name} · ${property.type}`,
                documentation: property.description
                  ? { value: property.description }
                  : undefined,
                insertText: property.name,
                range,
                sortText: `1_${property.name}`,
              })),
            ],
          };
        }

        const variable = inferVariableTypes(model.getValue(), classes).get(
          owner
        );
        const target = variable?.isList
          ? null
          : classes.find((cls) => cls.name === variable?.className);
        if (!target) return { suggestions: [] };

        return {
          suggestions: target.properties.map((property) => ({
            label: property.name,
            kind: monaco.languages.CompletionItemKind.Field,
            detail: `${target.name}.${property.name} · ${property.type}`,
            documentation: property.description
              ? { value: property.description }
              : undefined,
            insertText: property.name,
            range,
            sortText: `0_${property.name}`,
          })),
        };
      }

      return {
        suggestions: classes.map((cls) => ({
          label: cls.name,
          kind: monaco.languages.CompletionItemKind.Class,
          detail: `table · ${cls.tableName ?? cls.name}`,
          documentation: { value: classDoc(cls) },
          insertText: cls.name,
          range,
          sortText: `1_${cls.name}`,
        })),
      };
    },
  });

  monaco.languages.registerHoverProvider(language, {
    provideHover(model, position) {
      const classes = schemaRegistry.get(model.uri.toString()) ?? [];
      if (!classes.length) return null;

      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      );

      const asClass = classes.find((cls) => cls.name === word.word);
      if (asClass) {
        return {
          range,
          contents: [
            { value: `**${asClass.name}** — database class` },
            { value: classDoc(asClass) },
          ],
        };
      }

      const variables = inferVariableTypes(model.getValue(), classes);
      const variable = variables.get(word.word);
      if (variable) {
        return {
          range,
          contents: [
            {
              value: `**${word.word}**: ${
                variable.isList
                  ? `list[${variable.className}]`
                  : variable.className
              }`,
            },
          ],
        };
      }

      const before = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: word.startColumn,
      });
      const owner = /([A-Za-z_]\w*)\s*\.\s*$/.exec(before)?.[1];
      if (!owner) return null;

      const ownerType = variables.get(owner);
      const target =
        classes.find((cls) => cls.name === owner) ??
        classes.find(
          (cls) =>
            cls.name === (ownerType?.isList ? null : ownerType?.className)
        );
      const property = target?.properties.find(
        (item) => item.name === word.word
      );
      if (!target || !property) return null;

      return {
        range,
        contents: [
          { value: `**${target.name}.${property.name}**: ${property.type}` },
          ...(property.description ? [{ value: property.description }] : []),
        ],
      };
    },
  });
}

function buildSchemaDecorations(
  model: Monaco.editor.ITextModel,
  monaco: typeof Monaco,
  classes: SchemaClass[]
): Monaco.editor.IModelDeltaDecoration[] {
  if (!classes.length) return [];

  const decorations: Monaco.editor.IModelDeltaDecoration[] = [];
  const lines = model.getValue().split("\n");

  for (const cls of classes) {
    const pattern = new RegExp(`\\b${escapeRegex(cls.name)}\\b`, "g");
    lines.forEach((line, lineIdx) => {
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(line)) !== null) {
        const startColumn = match.index + 1;
        decorations.push({
          range: new monaco.Range(
            lineIdx + 1,
            startColumn,
            lineIdx + 1,
            startColumn + cls.name.length
          ),
          options: { inlineClassName: "schema-class-ref" },
        });
      }
    });
  }

  return decorations;
}

let validatorsSilenced = false;

function silenceBuiltInValidators(monaco: typeof Monaco) {
  if (validatorsSilenced) return;
  validatorsSilenced = true;

  const languages = monaco.languages as unknown as {
    typescript?: Record<
      "typescriptDefaults" | "javascriptDefaults",
      { setDiagnosticsOptions: (options: unknown) => void } | undefined
    >;
    json?: {
      jsonDefaults?: { setDiagnosticsOptions: (options: unknown) => void };
    };
  };

  const off = { noSemanticValidation: true, noSyntaxValidation: true };
  languages.typescript?.typescriptDefaults?.setDiagnosticsOptions(off);
  languages.typescript?.javascriptDefaults?.setDiagnosticsOptions(off);
  languages.json?.jsonDefaults?.setDiagnosticsOptions({ validate: false });
}

let ctxStyleInjected = false;

function injectContextStyles() {
  if (ctxStyleInjected) return;
  ctxStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .ctx-var-decl {
      color: #f59e0b !important;
      cursor: help;
    }
    .ctx-var-ref {
      color: #60a5fa !important;
      cursor: help;
    }
    .schema-class-ref {
      color: #c084fc !important;
      font-weight: 600;
      cursor: help;
    }
  `;
  document.head.appendChild(style);
}

function buildContextDecorations(
  model: Monaco.editor.ITextModel,
  monaco: typeof Monaco,
  contextEntries: ContextEntry[]
): Monaco.editor.IModelDeltaDecoration[] {
  if (!contextEntries.length) return [];

  const text = model.getValue();
  const lines = text.split("\n");
  const decorations: Monaco.editor.IModelDeltaDecoration[] = [];

  for (const { key } of contextEntries) {
    const pattern = new RegExp(`\\b${escapeRegex(key)}\\b`, "g");

    lines.forEach((line, lineIdx) => {
      const lineNumber = lineIdx + 1;
      const eqIdx = line.indexOf("=");
      const isDeclaration =
        eqIdx > 0 &&
        line.slice(0, eqIdx).trim() === key &&
        (line[eqIdx - 1] ?? "") !== "!" &&
        (line[eqIdx - 1] ?? "") !== "<" &&
        (line[eqIdx - 1] ?? "") !== ">" &&
        (line[eqIdx + 1] ?? "") !== "=";

      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;

      while ((match = pattern.exec(line)) !== null) {
        const startColumn = match.index + 1;
        const endColumn = startColumn + key.length;
        decorations.push({
          range: new monaco.Range(
            lineNumber,
            startColumn,
            lineNumber,
            endColumn
          ),
          options: {
            inlineClassName: isDeclaration ? "ctx-var-decl" : "ctx-var-ref",
          },
        });
      }
    });
  }

  return decorations;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function CodeEditor({
  value,
  onChange,
  onSave,
  onRun,
  readOnly = false,
  path = "index.ts",
  language = "typescript",
  height = "70vh",
  minHeight,
  maxHeight,
  autoHeight = false,
  themeMode = "light",
  backgroundColor,
  contentPaddingTop = 16,
  runButtonLabel = <PlayArrowIcon fontSize="small" />,
  lintAdapter,
  formatAdapter,
  contextEntries = [],
  schemaClasses = [],
  showDiagnostics = Boolean(lintAdapter),
}: ReusableCodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const lintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decorationsRef =
    useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const contextEntriesRef = useRef<ContextEntry[]>(contextEntries);
  const schemaClassesRef = useRef<SchemaClass[]>(schemaClasses);
  const tooltipNodeRef = useRef<HTMLDivElement | null>(null);
  const tooltipPositionRef =
    useRef<Monaco.editor.IContentWidgetPosition | null>(null);
  const modelUriRef = useRef<string>("");
  const [autoHeightPx, setAutoHeightPx] = useState<number>(0);
  const [hasSelection, setHasSelection] = useState(false);

  const baseTheme = themeMode === "dark" ? "vs-dark" : "vs-light";
  const defineThemeBase: Monaco.editor.BuiltinTheme =
    themeMode === "dark" ? "vs-dark" : "vs";
  const theme = useMemo(
    () => (backgroundColor ? "reusable-code-editor-custom" : baseTheme),
    [backgroundColor, baseTheme]
  );

  const updateDecorations = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const newDecorations = [
      ...buildContextDecorations(model, monaco, contextEntriesRef.current),
      ...buildSchemaDecorations(model, monaco, schemaClassesRef.current),
    ];

    if (decorationsRef.current) {
      decorationsRef.current.set(newDecorations);
    } else {
      decorationsRef.current =
        editor.createDecorationsCollection(newDecorations);
    }
  };

  useEffect(() => {
    contextEntriesRef.current = contextEntries;
    if (modelUriRef.current) {
      ctxCompletionRegistry.set(modelUriRef.current, contextEntries);
    }
    updateDecorations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextEntries]);

  useEffect(() => {
    schemaClassesRef.current = schemaClasses;
    if (modelUriRef.current) {
      schemaRegistry.set(modelUriRef.current, schemaClasses);
    }
    updateDecorations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaClasses]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco) return;
    ensureCompletionProvider(monaco, language);
    ensureSchemaProviders(monaco, language);
  }, [language]);

  useEffect(() => {
    return () => {
      if (modelUriRef.current) {
        ctxCompletionRegistry.delete(modelUriRef.current);
        schemaRegistry.delete(modelUriRef.current);
      }
    };
  }, []);

  const runLint = async () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model || !lintAdapter) return;

    const diagnostics = await lintAdapter({
      value: model.getValue(),
      model,
    });

    monaco.editor.setModelMarkers(
      model,
      "reusable-code-editor",
      diagnostics.map((item) => ({
        startLineNumber: item.startLineNumber,
        startColumn: item.startColumn,
        endLineNumber: item.endLineNumber,
        endColumn: item.endColumn,
        message: item.message,
        severity: severityMap[item.severity || "warning"],
      }))
    );
  };

  const runFormat = async () => {
    const editor = editorRef.current;
    if (!editor || !formatAdapter) return;
    const currentValue = editor.getValue();
    const formatted = await formatAdapter({ value: currentValue, language });

    if (typeof formatted === "string" && formatted !== currentValue) {
      editor.setValue(formatted);
      onChange(formatted);
    }
  };

  const applyCustomTheme = () => {
    const monaco = monacoRef.current;
    if (!monaco || !backgroundColor) return;
    monaco.editor.defineTheme("reusable-code-editor-custom", {
      base: defineThemeBase,
      inherit: true,
      rules: [],
      colors: { "editor.background": backgroundColor },
    });
    monaco.editor.setTheme("reusable-code-editor-custom");
  };

  useEffect(() => {
    applyCustomTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundColor, defineThemeBase]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    decorationsRef.current = null;

    applyCustomTheme();
    injectContextStyles();
    if (!showDiagnostics) {
      silenceBuiltInValidators(monaco);
    }
    ensureCompletionProvider(monaco, language);
    ensureSchemaProviders(monaco, language);

    const syncModelUri = () => {
      const uri = editor.getModel()?.uri.toString() ?? "";
      if (uri !== modelUriRef.current) {
        if (modelUriRef.current) {
          ctxCompletionRegistry.delete(modelUriRef.current);
          schemaRegistry.delete(modelUriRef.current);
        }
        modelUriRef.current = uri;
        if (uri) {
          ctxCompletionRegistry.set(uri, contextEntriesRef.current);
          schemaRegistry.set(uri, schemaClassesRef.current);
        }
      }
    };

    syncModelUri();

    editor.onDidChangeModel(() => {
      decorationsRef.current = null;
      syncModelUri();
      updateDecorations();
    });

    editor.onDidChangeModelContent(() => {
      updateDecorations();
    });

    const tooltipNode = document.createElement("div");
    tooltipNode.style.cssText = [
      "background:#1e1e2e",
      "border:1px solid #3c3c5c",
      "border-radius:6px",
      "padding:8px 12px",
      "font-size:12px",
      "font-family:'JetBrains Mono','Fira Code',monospace",
      "color:#cdd6f4",
      "pointer-events:none",
      "min-width:260px",
      "max-width:520px",
      "line-height:1.6",
      "box-shadow:0 4px 12px rgba(0,0,0,.4)",
      "z-index:100",
    ].join(";");
    tooltipNodeRef.current = tooltipNode;

    const tooltipWidget: Monaco.editor.IContentWidget = {
      getId: () => "ctx.var.tooltip",
      getDomNode: () => tooltipNode,
      getPosition: () => tooltipPositionRef.current,
    };
    editor.addContentWidget(tooltipWidget);

    const hideTooltip = () => {
      tooltipPositionRef.current = null;
      editor.layoutContentWidget(tooltipWidget);
    };

    editor.onMouseMove((e) => {
      const pos = e.target.position;
      if (!pos) {
        hideTooltip();
        return;
      }

      const range = new monaco.Range(
        pos.lineNumber,
        pos.column,
        pos.lineNumber,
        pos.column + 1
      );
      const decorations = editor.getDecorationsInRange(range) ?? [];
      const hit = decorations.find(
        (d) =>
          d.options.inlineClassName === "ctx-var-decl" ||
          d.options.inlineClassName === "ctx-var-ref"
      );

      if (!hit) {
        hideTooltip();
        return;
      }

      const tokenText = editor.getModel()?.getValueInRange(hit.range) ?? "";
      const entry = contextEntriesRef.current.find((c) => c.key === tokenText);
      if (!entry) {
        hideTooltip();
        return;
      }

      const isDecl = hit.options.inlineClassName === "ctx-var-decl";
      const valueHtml =
        entry.value === null
          ? `<span style="color:#6c7086;font-style:italic">populated at runtime</span>`
          : `<span style="color:#a6e3a1">${escapeHtml(
              typeof entry.value === "object"
                ? JSON.stringify(entry.value)
                : String(entry.value)
            )}</span>`;

      tooltipNode.innerHTML = [
        `<div><span style="color:#89b4fa;font-weight:600">ctx</span> <span style="color:#f38ba8">${escapeHtml(
          entry.key
        )}</span></div>`,
        `<div style="color:#a6adc8;margin-top:2px">value: ${valueHtml}</div>`,
        entry.description
          ? `<div style="color:#6c7086;margin-top:2px;font-size:11px">${escapeHtml(
              entry.description
            )}</div>`
          : "",
        `<div style="color:#6c7086;margin-top:2px;font-size:11px">${
          isDecl ? "declared here" : "from context store"
        }</div>`,
      ]
        .filter(Boolean)
        .join("");

      tooltipPositionRef.current = {
        position: {
          lineNumber: hit.range.startLineNumber,
          column: hit.range.startColumn,
        },
        preference: [monaco.editor.ContentWidgetPositionPreference.BELOW],
      };
      editor.layoutContentWidget(tooltipWidget);
    });

    editor.onMouseLeave(hideTooltip);

    editor.onDidChangeCursorSelection(({ selection }) =>
      setHasSelection(!selection.isEmpty())
    );

    editor.addAction({
      id: "saveEvent",
      label: "Save",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: async () => {
        await runFormat();
        onSave?.(editor.getValue());
      },
    });

    if (autoHeight) {
      const syncHeight = () => {
        const contentHeight = editor.getContentHeight();
        const clamped = Math.max(
          minHeight ?? 0,
          maxHeight !== undefined
            ? Math.min(contentHeight, maxHeight)
            : contentHeight
        );
        setAutoHeightPx(clamped);
        editor.layout({
          width: editor.getLayoutInfo().width,
          height: clamped,
        });
      };
      editor.onDidContentSizeChange(syncHeight);
      syncHeight();
    }

    void runLint();
    updateDecorations();
  };

  const handleRun = () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();

    const selected =
      model && selection && !selection.isEmpty()
        ? model.getValueInRange(selection)
        : "";

    onRun?.(selected.trim() ? selected : editor?.getValue() ?? value);
  };

  const resolvedHeight = autoHeight && autoHeightPx > 0 ? autoHeightPx : height;

  return (
    <div style={{ position: "relative", height: resolvedHeight }}>
      {onRun ? (
        <Tooltip
          title={hasSelection ? "Run selection" : "Run"}
          placement="top"
          arrow
        >
          <Fab
            onClick={handleRun}
            color="inherit"
            sx={{
              background: "#2e7d32",
              color: "#fff",
              "&:hover": {
                background: "#388e3c",
              },
              position: "absolute",
              right: 12,
              bottom: 12,
            }}
          >
            {runButtonLabel}
          </Fab>
        </Tooltip>
      ) : null}

      <Editor
        path={path}
        language={language}
        value={value}
        onChange={(nextValue) => {
          const resolved = nextValue || "";
          onChange(resolved);
          if (lintTimerRef.current) {
            clearTimeout(lintTimerRef.current);
          }
          lintTimerRef.current = setTimeout(() => {
            void runLint();
          }, 350);
        }}
        onMount={handleMount}
        height="100%"
        theme={theme}
        options={{
          tabSize: 2,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 13,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollbar: {
            vertical: autoHeight ? "hidden" : "auto",
            horizontal: "hidden",
            alwaysConsumeMouseWheel: !autoHeight,
            verticalScrollbarSize: 4,
          },
          scrollBeyondLastLine: false,
          overviewRulerLanes: 0,
          readOnly,
          renderValidationDecorations: showDiagnostics ? "editable" : "off",
          renderLineHighlightOnlyWhenFocus: true,
          selectOnLineNumbers: true,
          padding: { top: contentPaddingTop, bottom: 16 },
          lineDecorationsWidth: 4,
          glyphMargin: false,
          fixedOverflowWidgets: true,
          hover: { above: false },
        }}
      />
    </div>
  );
}
