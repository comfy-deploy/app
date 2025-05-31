"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useMemo } from "react";
import React from "react";
import { CopyButton } from "./copy-button";
import { Skeleton } from "./skeleton";
// import Editor from "react-simple-code-editor";

import type { HighlighterCore, StringLiteralUnion } from "shiki/core";
import { useTheme } from "../theme-provider";
import { cn } from "@/lib/utils";

async function getHighlighter() {
  const [
    { getHighlighterCore },
    { default: ts },
    { default: js },
    { default: python },
    { default: bash },
    { default: docker },
    { default: json },
    { default: minLight },
    { default: oneDarkPro },
    { default: getWasm },
  ] = await Promise.all([
    import("shiki/core"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/bash.mjs"),
    import("shiki/langs/dockerfile.mjs"),
    import("shiki/langs/json.mjs"),
    import("shiki/themes/min-light.mjs"),
    import("shiki/themes/one-dark-pro.mjs"),
    import("shiki/wasm.mjs"),
  ]);

  const highlighter = await getHighlighterCore({
    themes: [minLight, oneDarkPro],
    langs: [ts, js, python, bash, docker, json],
    loadWasm: getWasm,
  });
  return highlighter;
}

const highlighter: HighlighterCore | undefined = undefined;

// export function highlightCode(code: string, lang: StringLiteralUnion<string>) {
//   if (!highlighter) {
//     getHighlighter().then((e) => {
//       highlighter = e;
//     });
//   }
//   return highlighter?.codeToHtml(code, {
//     lang,
//     theme: "min-light",
//   });
// }

// export function EditCodeBlock(props: {
// 	code: string;
// 	onChange: (code: string) => void;
// 	lang: StringLiteralUnion<string>;
// }) {
// 	const [_highlighter, setHighlighter] = React.useState<
// 		HighlighterCore | undefined
// 	>(highlighter);

// 	useEffect(() => {
// 		if (!highlighter) getHighlighter().then(setHighlighter);
// 	}, []);

// 	return (
// 		<Editor
// 			className="rounded-xl [&>pre]:!p-0 [&>pre>br]:hidden"
// 			value={props.code}
// 			onValueChange={(code) => props.onChange(code)}
// 			highlight={(code) => {
// 				return _highlighter?.codeToHtml(code, {
// 					lang: props.lang,
// 					theme: "min-light",
// 				});
// 			}}
// 			textareaClassName="caret-white"
// 			padding={8}
// 			style={{
// 				fontFamily: '"Fira code", "Fira Mono", monospace',
// 				fontSize: 12,
// 			}}
// 		/>
// 	);
// }

export function CodeBlock(props: {
  code: string;
  lang: StringLiteralUnion<string>;
  className?: string;
  hideCopy?: boolean;
  scrollAreaClassName?: string;
}) {
  const [_highlighter, setHighlighter] = React.useState<
    HighlighterCore | undefined
  >(highlighter);
  const { theme } = useTheme();
  const shikiTheme = theme === "dark" ? "one-dark-pro" : "min-light";

  useEffect(() => {
    if (!highlighter) getHighlighter().then(setHighlighter);
  }, []);

  const { codeLines, code } = useMemo(() => {
    if (!props.code)
      return {
        code: undefined,
        codeLines: 0,
      };

    const trim = props.code.trim();
    const codeLines = trim.split("\n").length;

    if (!_highlighter) {
      return {
        code: undefined,
        codeLines,
      };
    }

    const code = _highlighter.codeToHtml(trim, {
      lang: props.lang,
      theme: shikiTheme,
    });

    return {
      code,
      codeLines,
    };
  }, [props.code, _highlighter, shikiTheme]);

  const skeletonHeight = codeLines * 1.5 + 2; // Adjust the multiplier based on your design needs

  return (
    <ScrollArea
      className={cn(
        "group relative w-full rounded-lg text-sm transition-height",
        props.scrollAreaClassName,
      )}
    >
      {!code && (
        <Skeleton
          className="w-full"
          style={{ height: `${skeletonHeight}rem` }}
        />
      )}

      {code && (
        <>
          <p
            className={`[&>pre]:!bg-gray-100 dark:[&>pre]:!bg-zinc-900 max-h-96 w-fit min-w-full overflow-visible rounded-lg [&>pre]:p-4 ${props.className}`}
            style={{
              overflowWrap: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html: code,
            }}
          />
          {!props.hideCopy && (
            <CopyButton
              className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
              text={props.code}
            />
          )}
        </>
      )}
    </ScrollArea>
  );
}
