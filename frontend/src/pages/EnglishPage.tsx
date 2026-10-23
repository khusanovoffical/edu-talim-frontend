import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, BookOpen, CheckCircle2, XCircle,
  Bot, ArrowRight, Trophy, RotateCw, Volume2
} from 'lucide-react';
import { BackButton } from '../components/BackButton';

type Level = 'A1' | 'A2' | 'B1' | 'B2';

interface VocabItem { word: string; phonetic: string; uzbek: string; example: string; }
interface Question { q: string; options: string[]; correct: string; explanation: string; }

// Daraja bo'yicha so'zlar
const VOCAB: Record<Level, VocabItem[]> = {
  A1: [
    { word: 'Apple', phonetic: '[ˈæpəl]', uzbek: 'Olma', example: 'I eat an apple every day.' },
    { word: 'School', phonetic: '[skuːl]', uzbek: 'Maktab', example: 'I go to school at 8 o\'clock.' },
    { word: 'Book', phonetic: '[bʊk]', uzbek: 'Kitob', example: 'This book is very interesting.' },
    { word: 'Family', phonetic: '[ˈfæməli]', uzbek: 'Oila', example: 'My family has four members.' },
    { word: 'Friend', phonetic: '[frend]', uzbek: 'Do\'st', example: 'Ali is my best friend.' },
    { word: 'Water', phonetic: '[ˈwɔːtər]', uzbek: 'Suv', example: 'I drink water every morning.' },
  ],
  A2: [
    { word: 'Knowledge', phonetic: '[ˈnɒlɪdʒ]', uzbek: 'Bilim', example: 'EduAI helps students acquire deep knowledge.' },
    { word: 'Improve', phonetic: '[ɪmˈpruːv]', uzbek: 'Yaxshilamoq', example: 'Daily practice will improve your English skills.' },
    { word: 'Opportunity', phonetic: '[ˌɒpəˈtjuːnəti]', uzbek: 'Imkoniyat', example: 'IT Yoshlar offers great opportunities.' },
    { word: 'Successful', phonetic: '[səkˈsɛsfʊl]', uzbek: 'Muvaffaqiyatli', example: 'Diligent students become successful.' },
    { word: 'Challenge', phonetic: '[ˈtʃælɪndʒ]', uzbek: 'Sinov, qiyinchilik', example: 'Learning programming is an exciting challenge.' },
    { word: 'Describe', phonetic: '[dɪˈskraɪb]', uzbek: 'Tasvirlamoq', example: 'Can you describe your school?' },
  ],
  B1: [
    { word: 'Achievement', phonetic: '[əˈtʃiːvmənt]', uzbek: 'Yutuq, muvaffaqiyat', example: 'Winning the competition was a great achievement.' },
    { word: 'Environment', phonetic: '[ɪnˈvaɪrənmənt]', uzbek: 'Muhit, atrof-olam', example: 'We must protect our environment.' },
    { word: 'Influence', phonetic: '[ˈɪnfluəns]', uzbek: 'Ta\'sir, nufuz', example: 'Teachers have a great influence on students.' },
    { word: 'Responsible', phonetic: '[rɪˈspɒnsɪbl]', uzbek: 'Mas\'uliyatli', example: 'Be responsible for your actions.' },
    { word: 'Determination', phonetic: '[dɪˌtɜːmɪˈneɪʃn]', uzbek: 'Qat\'iyat, irodali bo\'lish', example: 'Success requires determination and hard work.' },
    { word: 'Consequently', phonetic: '[ˈkɒnsɪkwəntli]', uzbek: 'Natijada, shuning uchun', example: 'He studied hard; consequently, he passed.' },
  ],
  B2: [
    { word: 'Sophisticated', phonetic: '[səˈfɪstɪkeɪtɪd]', uzbek: 'Murakkab, nozik', example: 'The AI uses a sophisticated algorithm.' },
    { word: 'Inevitable', phonetic: '[ɪnˈevɪtəbl]', uzbek: 'Muqarrar, oldini olib bo\'lmas', example: 'Change is inevitable in technology.' },
    { word: 'Ambiguous', phonetic: '[æmˈbɪɡjuəs]', uzbek: 'Noaniq, ikki ma\'noli', example: 'The instructions were ambiguous.' },
    { word: 'Perseverance', phonetic: '[ˌpɜːsɪˈvɪərəns]', uzbek: 'Chidamlilik, qat\'iyat', example: 'Perseverance is the key to mastering any language.' },
    { word: 'Pragmatic', phonetic: '[præɡˈmætɪk]', uzbek: 'Amaliy, pragmatik', example: 'A pragmatic approach solves problems faster.' },
    { word: 'Unprecedented', phonetic: '[ʌnˈpresɪdentɪd]', uzbek: 'Misli ko\'rilmagan', example: 'AI development has been unprecedented.' },
  ],
};

// Daraja bo'yicha savollar
const QUESTIONS: Record<Level, Question[]> = {
  A1: [
    { q: 'My name ___ Ali.', options: ['am', 'is', 'are', 'be'], correct: 'is', explanation: '3-shaxs birlik (he/she/it) uchun "is" ishlatiladi.' },
    { q: 'I have ___ apple.', options: ['a', 'an', 'the', 'any'], correct: 'an', explanation: 'Unli harf (a, e, i, o, u) bilan boshlangan so\'z oldiga "an" qo\'yiladi.' },
    { q: 'They ___ in the park.', options: ['is', 'am', 'are', 'be'], correct: 'are', explanation: 'Ko\'plik (they) uchun "are" ishlatiladi.' },
    { q: 'What is the Uzbek meaning of "Book"?', options: ['Kitob', 'Daftar', 'Qalam', 'Stol'], correct: 'Kitob', explanation: '"Book" so\'zi o\'zbek tilida "Kitob" degani.' },
    { q: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'went'], correct: 'goes', explanation: '3-shaxs birlik (she) uchun Present Simple da "goes" ishlatiladi.' },
    { q: 'How ___ you?', options: ['is', 'am', 'are', 'be'], correct: 'are', explanation: '"You" uchun har doim "are" ishlatiladi.' },
    { q: 'The cat ___ on the mat.', options: ['sit', 'sits', 'sitting', 'sate'], correct: 'sits', explanation: 'Present Simple: 3-shaxs birlik "sits".' },
  ],
  A2: [
    { q: 'Look! The students ___ an exciting project in the lab.', options: ['are developing', 'develop', 'developed', 'develops'], correct: 'are developing', explanation: '"Look!" Present Continuous belgisi. They + are + developing.' },
    { q: 'Nodir usually ___ to school by bus every morning.', options: ['is going', 'goes', 'go', 'went'], correct: 'goes', explanation: '"Every morning" - odatiy harakat. 3-shaxs birlik "goes".' },
    { q: 'What is the Uzbek meaning of "Opportunity"?', options: ['Imkoniyat', 'Qiyinchilik', 'Bilim', 'Muvaffaqiyat'], correct: 'Imkoniyat', explanation: '"Opportunity" - "imkoniyat, qulay vaziyat" demak.' },
    { q: 'She ___ English for 3 years.', options: ['learn', 'has learned', 'is learning', 'learns'], correct: 'has learned', explanation: '"For 3 years" - davom etgan harakat: Present Perfect.' },
    { q: 'We ___ a test yesterday.', options: ['have', 'had', 'are having', 'has'], correct: 'had', explanation: '"Yesterday" - o\'tgan zamon belgisi. "Had" ishlatiladi.' },
    { q: '"Successful" so\'zining ma\'nosi nima?', options: ['Muvaffaqiyatli', 'Muvaffaqiyatsiz', 'Muhim', 'Oddiy'], correct: 'Muvaffaqiyatli', explanation: '"Successful" = muvaffaqiyatga erishgan.' },
    { q: 'I ___ my homework when my friend called.', options: ['did', 'was doing', 'do', 'have done'], correct: 'was doing', explanation: 'Qo\'ng\'iroq bo\'lganida davom etayotgan harakat: Past Continuous.' },
  ],
  B1: [
    { q: 'If I ___ more time, I would travel.', options: ['have', 'had', 'has', 'having'], correct: 'had', explanation: 'Conditional II: "If + Past Simple + would". Real bo\'lmagan shart.' },
    { q: 'The report ___ by the manager yesterday.', options: ['write', 'was written', 'wrote', 'has written'], correct: 'was written', explanation: 'Passive voice Past Simple: "was + Past Participle".' },
    { q: 'She suggested ___ early.', options: ['to leave', 'leaving', 'leave', 'left'], correct: 'leaving', explanation: '"Suggest" fe\'lidan keyin gerund (-ing) ishlatiladi.' },
    { q: '"Achievement" so\'zining ma\'nosi?', options: ['Yutuq', 'Qiyinchilik', 'Imtihon', 'Sabab'], correct: 'Yutuq', explanation: '"Achievement" = muvaffaqiyat, erishilgan yutuq.' },
    { q: 'He spoke so quietly that I ___ hear him.', options: ['could', 'couldn\'t', 'can', 'would'], correct: 'couldn\'t', explanation: '"So... that" konstruksiyasi: juda sekin gapirdi, shuning uchun eshita olmadim.' },
    { q: 'They ___ in Paris for 10 years before moving to London.', options: ['lived', 'had lived', 'have lived', 'were living'], correct: 'had lived', explanation: 'Past Perfect: Londondan oldin bo\'lgan harakat "had + Past Participle".' },
    { q: 'Despite ___ hard, he failed the exam.', options: ['study', 'studying', 'studied', 'to study'], correct: 'studying', explanation: '"Despite" prepositiondan keyin gerund (-ing) keladi.' },
  ],
  B2: [
    { q: 'Had she arrived earlier, she ___ the meeting.', options: ['would attend', 'would have attended', 'attended', 'had attended'], correct: 'would have attended', explanation: 'Conditional III: Had + Past Perfect → would have + Past Participle.' },
    { q: '"Sophisticated" qaysi ma\'noni ifodalaydi?', options: ['Oddiy', 'Murakkab va nozik', 'Yangi', 'Katta'], correct: 'Murakkab va nozik', explanation: '"Sophisticated" — murakkab, rivojlangan, nozik ma\'noli so\'z.' },
    { q: 'The data ___ to support the hypothesis.', options: ['appears', 'appear', 'appeared', 'are appearing'], correct: 'appear', explanation: '"Data" ko\'plik shakl sifatida qabul qilinadi: "appear" to\'g\'ri.' },
    { q: 'Not only did he win the prize, ___ he also received a scholarship.', options: ['and', 'but', 'or', 'so'], correct: 'but', explanation: '"Not only... but also" — standart inversiya konstruksiyasi.' },
    { q: 'The company\'s profits, ___ had been declining, suddenly increased.', options: ['which', 'who', 'that', 'whose'], correct: 'which', explanation: 'Non-defining relative clause: vergul bilan ajratilgan, "which" ishlatiladi.' },
    { q: '"Inevitable" so\'zining ma\'nosi?', options: ['Muqarrar', 'Kutilmagan', 'Mumkin', 'Ahamiyatli'], correct: 'Muqarrar', explanation: '"Inevitable" = muqarrar, oldini olish mumkin bo\'lmagan.' },
    { q: 'I wish I ___ more careful with my words.', options: ['was', 'were', 'am', 'be'], correct: 'were', explanation: '"Wish" dan keyin past subjunctive: "were" (grammatik jihatdan to\'g\'ri).' },
  ],
};

const LEVEL_INFO: Record<Level, { label: string; color: string; bg: string; desc: string }> = {
  A1: { label: 'A1 — Boshlang\'ich', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300', desc: 'Eng oddiy jumlalar, salomlashish, o\'zi haqida gapirish.' },
  A2: { label: 'A2 — Elementar', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300', desc: 'Kundalik suhbat, o\'tgan zamon, oddiy Present/Past.' },
  B1: { label: 'B1 — O\'rta', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-300', desc: 'Conditional, Passive voice, murakkab gaplar.' },
  B2: { label: 'B2 — Yuqori', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300', desc: 'Murakkab grammatika, akademik yozuv, inversiya.' },
};

export const EnglishPage: React.FC = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState<Level>('A2');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [activeSection, setActiveSection] = useState<'both' | 'vocab' | 'quiz'>('both');

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const questions = QUESTIONS[level];
  const vocab = VOCAB[level];
  const info = LEVEL_INFO[level];

  const handleLevelChange = (l: Level) => {
    setLevel(l);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleSelectOption = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);
    if (opt === questions[currentQuestion].correct) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />

      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
              <Globe className="w-3.5 h-3.5 text-violet-300" />
              <span>EduAI Ingliz tili moduli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ingliz tili (English Language)
            </h1>
            <p className="text-sm text-violet-100 mt-1 max-w-xl">
              Lug'at boyligini oshirish, zamonlar grammatikasi va interaktiv test mashqlari.
            </p>
          </div>

          {/* Daraja tugmalari */}
          <div className="flex items-center gap-1.5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md self-start sm:self-auto">
            {(['A1', 'A2', 'B1', 'B2'] as Level[]).map(l => (
              <button
                key={l}
                onClick={() => handleLevelChange(l)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  level === l
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-violet-200 hover:text-white hover:bg-white/10'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daraja ma'lumoti */}
      <div className={`rounded-2xl p-4 border ${info.bg} flex items-center gap-3`}>
        <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
        <span className="text-slate-500 text-xs">—</span>
        <span className="text-slate-700 text-xs">{info.desc}</span>
      </div>

      {/* Rejimni tanlash (Lug'at yoki Grammatika testi) */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSection('both')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSection === 'both' ? 'bg-violet-700 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Barcha bo'limlar
        </button>
        <button
          onClick={() => setActiveSection('vocab')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSection === 'vocab' ? 'bg-violet-700 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Kunlik Lug'at (Audio talaffuz)
        </button>
        <button
          onClick={() => setActiveSection('quiz')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSection === 'quiz' ? 'bg-violet-700 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Grammatika Testi (Lug'atsiz)
        </button>
      </div>

      {/* Lug'at Kartochkalari (Grammatika testi vaqtida yashirish mumkin) */}
      {activeSection !== 'quiz' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-50 text-violet-700 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Mavzuviy Lug'at Kartochkalari</h3>
                <p className="text-xs text-slate-500">{level} darajasiga oid faol so'zlar va talaffuzi</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/ai-tutor')}
              className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold hover:bg-violet-100 transition flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" />
              <span>AI bilan o'rganish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vocab.map((v, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 bg-slate-50/50 hover:bg-violet-50/20 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">{v.word}</span>
                    <button
                      type="button"
                      onClick={() => speakWord(v.word)}
                      className="p-1 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 transition"
                      title="Audio talaffuzni tinglash"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{v.phonetic}</span>
                </div>
                <p className="text-sm font-semibold text-violet-700">{v.uzbek}</p>
                <p className="text-xs text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-100">
                  "{v.example}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammatika Sinovi */}
      {activeSection !== 'vocab' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Grammatika va Test Sinovi</h3>
            {!quizFinished && (
              <p className="text-xs text-slate-500">{currentQuestion + 1}/{questions.length} savol · Ball: {score}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
              {level} daraja
            </span>
            <button
              onClick={handleRestartQuiz}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="Qayta boshlash"
            >
              <RotateCw className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {quizFinished ? (
          /* Natija ko'rsatish */
          <div className="text-center py-8 space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              percentage >= 80 ? 'bg-emerald-100' : percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <Trophy className={`w-10 h-10 ${
                percentage >= 80 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-500'
              }`} />
            </div>
            <h4 className="text-2xl font-extrabold text-slate-900">{percentage}%</h4>
            <p className="text-slate-600">
              {questions.length} ta savoldan <strong>{score} tasiga</strong> to'g'ri javob berdingiz.
            </p>
            <p className={`text-sm font-semibold ${
              percentage >= 80 ? 'text-emerald-700' : percentage >= 50 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {percentage >= 80 ? '🎉 Ajoyib! Daraja aniq o\'zlashtirilgan!' :
               percentage >= 50 ? '👍 Yaxshi! Lekin yana mashq qiling.' :
               '📚 Ko\'proq mashq kerak. Qayta ishlang!'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRestartQuiz}
                className="px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-bold text-sm transition"
              >
                Qayta urinish
              </button>
              <button
                onClick={() => navigate('/ai-tutor')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition flex items-center gap-1.5"
              >
                <Bot className="w-4 h-4" />
                AI bilan ishlash
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div
                className="bg-violet-600 h-1.5 rounded-full transition-all"
                style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
              />
            </div>

            <p className="text-base font-bold text-slate-900">
              {questions[currentQuestion].q}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {questions[currentQuestion].options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = opt === questions[currentQuestion].correct;
                
                let btnClass = 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100';
                if (isAnswered) {
                  if (isCorrect) btnClass = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold';
                  else if (isSelected) btnClass = 'bg-red-50 text-red-900 border-red-300';
                } else if (isSelected) {
                  btnClass = 'bg-violet-50 text-violet-900 border-violet-500';
                }

                return (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-3.5 rounded-xl text-xs font-semibold text-left transition border ${btnClass}`}
                  >
                    <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 inline ml-2" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 inline ml-2" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  {selectedOption === questions[currentQuestion].correct ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Barakalla, to'g'ri javob!
                    </span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Noto'g'ri. To'g'ri javob: <strong>{questions[currentQuestion].correct}</strong>
                    </span>
                  )}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Qoida tahlili:</strong> {questions[currentQuestion].explanation}
                </p>
                <button
                  onClick={handleNextQuestion}
                  className="mt-2 px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs"
                >
                  <span>{currentQuestion < questions.length - 1 ? 'Keyingi savol' : 'Natijani ko\'rish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      )}

    </div>
  );
};
