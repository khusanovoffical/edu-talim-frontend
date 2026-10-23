import React from 'react';

interface MathRendererProps {
  content: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content }) => {
  // Matn ichidagi markdown va matematik formulalarni ajratib ko'rsatish
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-slate-800 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Sarlavhalar
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1">{trimmed.replace('### ', '')}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-xl font-extrabold text-slate-900 mt-4 mb-2">{trimmed.replace('# ', '')}</h1>;
        }

        // Iqtiboslar
        if (trimmed.startsWith('> ')) {
          return (
            <div key={idx} className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl text-amber-900 text-xs italic">
              {trimmed.replace('> ', '')}
            </div>
          );
        }

        // Ro'yxatlar
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>{renderFormattedText(trimmed.substring(2))}</span>
            </div>
          );
        }

        // Raqamli ro'yxatlar
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 font-medium">
              <span>{renderFormattedText(trimmed)}</span>
            </div>
          );
        }

        if (trimmed === '') {
          return <div key={idx} className="h-1.5" />;
        }

        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
};

// Yordamchi matn formatlash (qalin, kursiv, kod va formulalar)
function cleanMathFormula(formula: string): string {
  return formula
    .replace(/\\left\s*([(\[{])/g, '$1')
    .replace(/\\right\s*([)\]}])/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\times/g, ' × ')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\le/g, ' ≤ ')
    .replace(/\\ge/g, ' ≥ ')
    .replace(/\\ne/g, ' ≠ ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\[a-zA-Z]+/g, '') // qolgan latex komandalarini tozalash
    .replace(/[{}]/g, '');       // qolgan jingalak qavslarni tozalash
}

function renderFormattedText(text: string): React.ReactNode {
  // Tozalash: \[ va \] yoki \( va \) larni dollar bilan almashtirish
  const normalized = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // $formula$ yoki **bold** yoki `code` bo'laklari
  const parts = normalized.split(/(\$[^\$]+\$|\*\*[^\*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      // Matematik formula
      const rawFormula = part.slice(1, -1);
      const cleanFormula = cleanMathFormula(rawFormula);
      return (
        <span
          key={index}
          className="inline-block px-2 py-0.5 mx-1 bg-blue-50/90 text-blue-900 font-mono text-xs font-semibold rounded-md border border-blue-200/80 shadow-xs"
        >
          {cleanFormula}
        </span>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-mono rounded border border-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
