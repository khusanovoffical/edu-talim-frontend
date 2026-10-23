import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Safely renders Uzbek prose containing LaTeX math ($...$ and $$...$$) and bold (**...**) segments.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by block or inline math expressions
  const blocks = text.split('\n\n');

  const renderInline = (line: string, keyPrefix: string) => {
    // Split on $$...$$ or $...$
    const tokens = line.split(/(\$\$[^$]+\$\$|\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/g);
    return tokens.map((tok, idx) => {
      if (tok.startsWith('$$') && tok.endsWith('$$') && tok.length > 4) {
        const expr = tok.slice(2, -2);
        try {
          const html = katex.renderToString(expr, { throwOnError: false, displayMode: true });
          return (
            <span
              key={`${keyPrefix}-${idx}`}
              className="block my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={`${keyPrefix}-${idx}`}>{expr}</code>;
        }
      }
      if (tok.startsWith('$') && tok.endsWith('$') && tok.length > 2) {
        const expr = tok.slice(1, -1);
        try {
          const html = katex.renderToString(expr, { throwOnError: false, displayMode: false });
          return (
            <span
              key={`${keyPrefix}-${idx}`}
              className="inline-block mx-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={`${keyPrefix}-${idx}`}>{expr}</code>;
        }
      }
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-slate-900">
            {tok.slice(2, -2)}
          </strong>
        );
      }
      if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
        return (
          <code
            key={`${keyPrefix}-${idx}`}
            className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-xs font-mono"
          >
            {tok.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${idx}`}>{tok}</React.Fragment>;
    });
  };

  return (
    <div className={`space-y-2.5 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n');
        return (
          <p key={bIdx} className="text-slate-700 text-sm sm:text-[15px] leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {renderInline(line, `${bIdx}-${lIdx}`)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};
