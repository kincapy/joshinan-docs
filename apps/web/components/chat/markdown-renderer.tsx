'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown テキストを整形して表示するコンポーネント
 *
 * Claude の応答は Markdown 形式なので、見出し・リスト・テーブル・
 * コードブロックなどをリッチに表示する
 */
export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 見出し
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
        ),

        // 段落
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
        ),

        // リスト
        ul: ({ children }) => (
          <ul className="text-sm list-disc pl-5 mb-2 space-y-0.5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-sm list-decimal pl-5 mb-2 space-y-0.5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed">{children}</li>
        ),

        // インラインコード
        code: ({ children, className }) => {
          // コードブロック（言語指定あり）かインラインコードかを判定
          const isCodeBlock = className?.startsWith('language-')
          if (isCodeBlock) {
            return (
              <code className="block bg-zinc-900 text-zinc-100 rounded p-3 text-xs overflow-x-auto whitespace-pre">
                {children}
              </code>
            )
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          )
        },

        // コードブロックのラッパー
        pre: ({ children }) => (
          <pre className="mb-2 last:mb-0">{children}</pre>
        ),

        // テーブル（GFM）
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2 last:mb-0">
            <table className="text-xs border-collapse w-full">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">{children}</td>
        ),

        // 強調
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),

        // リンク
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            {children}
          </a>
        ),

        // 水平線
        hr: () => <hr className="border-border my-3" />,

        // 引用
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground mb-2 last:mb-0">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
