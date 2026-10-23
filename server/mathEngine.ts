/**
 * Deterministic Mathematics Evaluation & Verification Engine
 * Separates mathematical answer checking and arithmetic validation from the LLM.
 */

export interface MathCheckResult {
  isCorrect: boolean;
  normalizedStudentAnswer: string;
  feedbackUz: string;
}

/**
 * Parses a numeric or fraction string (e.g., "3/4", "0.75", "75%", "x = 5", "12") into a numeric value.
 */
export function parseMathValue(raw: string): number | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]\s*=\s*/, '') // allow "x = 7" -> "7"
    .replace(/,/g, '.')
    .replace(/\s+/g, '');

  if (!cleaned) return null;

  // Percentage e.g. "25%" -> 25 (or compare directly)
  if (cleaned.endsWith('%')) {
    const num = Number(cleaned.slice(0, -1));
    return Number.isFinite(num) ? num : null;
  }

  // Fraction e.g. "3/4" or "-5/2"
  if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(cleaned)) {
    const [numStr, denStr] = cleaned.split('/');
    const num = Number(numStr);
    const den = Number(denStr);
    if (den === 0 || !Number.isFinite(num) || !Number.isFinite(den)) return null;
    return num / den;
  }

  // Ratio e.g. "2:3"
  if (/^\d+:\d+$/.test(cleaned)) {
    const [a, b] = cleaned.split(':').map(Number);
    if (b === 0) return null;
    return a / b;
  }

  const direct = Number(cleaned);
  return Number.isFinite(direct) ? direct : null;
}

/**
 * Deterministically evaluates whether a student's answer matches the stored correct answer.
 * Supports multiple-choice, numeric/fraction equivalence, and normalized text matching.
 */
export function evaluateAnswerDeterministically(
  questionType: 'multiple_choice' | 'numeric' | 'fill_blank' | 'short_answer',
  studentAnswerRaw: string,
  correctAnswerRaw: string
): MathCheckResult {
  const studentClean = studentAnswerRaw.trim();
  const correctClean = correctAnswerRaw.trim();

  if (!studentClean) {
    return {
      isCorrect: false,
      normalizedStudentAnswer: '',
      feedbackUz: "Javob kiritilmadi. Iltimos, yechimingizni kiriting.",
    };
  }

  if (questionType === 'multiple_choice') {
    const isCorrect = studentClean.toLowerCase() === correctClean.toLowerCase();
    return {
      isCorrect,
      normalizedStudentAnswer: studentClean,
      feedbackUz: isCorrect
        ? "Barakalla! To'g'ri variantni tanladingiz."
        : "Tanlangan variant noto'g'ri. Masalaning shartini va izohni qayta ko'rib chiqing.",
    };
  }

  if (questionType === 'numeric') {
    // Also check if both are fractions and student didn't simplify when exact fraction string matches
    const studentVal = parseMathValue(studentClean);
    const correctVal = parseMathValue(correctClean);

    if (studentVal !== null && correctVal !== null) {
      const isCorrect = Math.abs(studentVal - correctVal) < 1e-6;
      return {
        isCorrect,
        normalizedStudentAnswer: String(studentVal),
        feedbackUz: isCorrect
          ? "Ajoyib! Matematik hisob-kitob to'g'ri bajarildi."
          : "Hisoblashda xatolik bor. Amal tartibini va sonlar qiymatini tekshirib ko'ring.",
      };
    }
  }

  // For fill_blank and short_answer (e.g. English grammar/vocabulary)
  const normStudent = studentClean.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');
  const acceptableAnswers = correctClean
    .split('|')
    .map((a) => a.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, ''));

  const isCorrect = acceptableAnswers.includes(normStudent);
  return {
    isCorrect,
    normalizedStudentAnswer: studentClean,
    feedbackUz: isCorrect
      ? "To'g'ri javob! Grammatik va leksik jihatdan aniq."
      : "Javobda tafovut bor. Kalit so'zlar va zamon qo'shimchalariga e'tibor bering.",
  };
}

/**
 * Deterministic arithmetic verifier used by the AI Tutor to validate simple equations/expressions in Uzbek.
 */
export function solveSimpleMathExpression(input: string): string | null {
  try {
    // Extract linear equation like "2x + 4 = 10" or "3x - 5 = 16"
    const linearMatch = input.replace(/\s+/g, '').match(/^(-?\d*)x([+-]\d+)=(-?\d+)$/i);
    if (linearMatch) {
      const aStr = linearMatch[1];
      const a = aStr === '' || aStr === '+' ? 1 : aStr === '-' ? -1 : Number(aStr);
      const b = Number(linearMatch[2]);
      const c = Number(linearMatch[3]);
      if (a !== 0 && Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) {
        const rhs = c - b;
        const x = rhs / a;
        return `Chiziqli tenglama tekshiruvi: ${a}x ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)} = ${c} ⇒ ${a}x = ${rhs} ⇒ x = ${Number.isInteger(x) ? x : x.toFixed(2)}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}
