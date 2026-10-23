import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AIConversation, ExplanationStyle } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { BackButton } from '../components/BackButton';
import {
  Sparkles, Send, Bot, User as UserIcon, Copy, Check,
  RotateCw, ThumbsUp, ThumbsDown, Lightbulb, MessageSquarePlus,
  BookOpen, Calculator, Globe, Trophy, Brain
} from 'lucide-react';

// Foizli sinov holati
interface QuizState {
  isActive: boolean;
  questions: string[];
  answers: string[];
  currentIndex: number;
  score: number;
  finished: boolean;
}

export const AiTutorPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<Array<{ sender: string; content: string; id?: number; hints?: string[]; follow_ups?: string[] }>>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Matematika');
  const [selectedGrade, setSelectedGrade] = useState<number>(user?.grade || 9);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [requestType, setRequestType] = useState('explain');
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Record<number, boolean>>({});
  const [quizState, setQuizState] = useState<QuizState>({
    isActive: false, questions: [], answers: [], currentIndex: 0, score: 0, finished: false
  });
  const [practiceAnswerCount, setPracticeAnswerCount] = useState(0);
  const [practiceCorrect, setPracticeCorrect] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        selectConversation(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectConversation = async (id: number) => {
    setActiveConvId(id);
    try {
      const conv = await api.getConversation(id);
      if (conv.messages) {
        setMessages(conv.messages.map(m => ({
          sender: m.sender,
          content: m.content,
          id: m.id
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartNewChat = () => {
    setActiveConvId(undefined);
    setMessages([
      {
        sender: 'assistant',
        content: `Assalomu alaykum, **${user?.full_name || "o'quvchi"}**! Men EduAI ta'lim repetitoriman. ${selectedSubject} fani bo'yicha qanday mavzuni yoki misolni tushuntirib beray?`
      }
    ]);
  };

  useEffect(() => {
    if (messages.length === 0) {
      handleStartNewChat();
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string, customType?: string) => {
    const textToSend = customText || inputQuestion;
    if (!textToSend.trim() || isSending) return;

    const rType = customType || requestType;
    const userMsg = { sender: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const res = await api.askAI({
        subject: selectedSubject,
        grade: selectedGrade,
        topic: selectedTopic || undefined,
        question: textToSend,
        explanation_style: user?.explanation_style || 'step_by_step',
        request_type: rType,
        conversation_id: activeConvId
      });

      if (!activeConvId) {
        setActiveConvId(res.conversation_id);
        loadConversations();
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          content: res.answer,
          id: res.message_id,
          hints: res.hints,
          follow_ups: res.follow_up_questions
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          content: `Xatolik yuz berdi: ${err.message || "Iltimos, qayta urinib ko'ring."}`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFeedback = async (messageId: number, isHelpful: boolean) => {
    if (feedbackSent[messageId]) return;
    try {
      await api.sendAiFeedback({ message_id: messageId, is_helpful: isHelpful });
      setFeedbackSent(prev => ({ ...prev, [messageId]: true }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-3">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-4">
      
      {/* Chap panel: Suhbatlar tarixi va sozlamalar */}
      <div className="hidden md:flex flex-col w-72 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm justify-between">
        <div className="space-y-4">
          <button
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Yangi suhbat boshlash
          </button>

          {/* 2 ta AI Ustoz tanlovi */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">AI Ustoz tanlash</label>
            
            {/* Matematika AI */}
            <button
              onClick={() => { setSelectedSubject('Matematika'); setMessages([{ sender: 'assistant', content: `Assalomu alaykum, **${user?.full_name || 'o\'quvchi'}**! 😊\n\nMen — **Matematika AI Ustozingizman!** Bilasizmi, matematika men uchun eng sevimli fan! Har bir formula ortida go'zal mantiq yashiringan.\n\nSizga ${selectedGrade}-sinf matematikasidan — tenglamalar, kasrlar, foizlar, geometriya — istalgan mavzuni **daftarga yozgandek** tushuntirib beraman. Savol bering!` }]); }}
              className={`w-full text-left p-3 rounded-xl border-2 transition ${selectedSubject === 'Matematika' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Matematika AI Ustozi</div>
                  <div className="text-[10px] text-slate-500">Samimiy va qadimgi ustoz 📐</div>
                </div>
              </div>
            </button>

            {/* Ingliz tili AI */}
            <button
              onClick={() => { setSelectedSubject('Ingliz tili'); setMessages([{ sender: 'assistant', content: `Hello there, **${user?.full_name || 'dear student'}**! 🌟\n\nMen — **Ingliz tili AI Ustozingizman!** Ingliz tilini o'rganish sarguzashtdir! Men sizga A1 dan B2 gacha bosqichma-bosqich olib boraman.\n\nGrammatika qoidalari, so'z boyligi, gap tuzish — hammasini **oson va qiziqarli** usulda o'rgataman. Qaysi mavzudan boshlashamiz?` }]); }}
              className={`w-full text-left p-3 rounded-xl border-2 transition ${selectedSubject === 'Ingliz tili' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-violet-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Ingliz tili AI Ustozi</div>
                  <div className="text-[10px] text-slate-500">Ilhomli va quvnoq ustoz 🗺️</div>
                </div>
              </div>
            </button>

            <div className="pt-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">O'quvchi sinfi:</span>
                <span className="font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md">
                  {user?.grade || 9}-sinf
                </span>
              </div>
            </div>
          </div>

          {/* Suhbatlar tarixi ro'yxati */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Avvalgi suhbatlar</span>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Suhbatlar tarixi bo'sh</p>
              ) : (
                conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition truncate block ${
                      activeConvId === c.id
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Xavfsizlik eslatmasi */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 leading-normal">
          <p className="font-semibold text-slate-700">EduAI Xavfsizligi:</p>
          EduAI ta'lim assistenti darslik talablariga mos javob beradi. Murakkab misollarni o'qituvchingiz bilan tekshirish tavsiya etiladi.
        </div>
      </div>

      {/* O'ng panel: Chat oynasi */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
        
        {/* Chat Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                EduAI Ta'lim Yordamchisi
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {selectedSubject} ({selectedGrade}-sinf)
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                O'zbek tilida bosqichma-bosqich tushuntirish va maslahatlar
              </p>
            </div>
          </div>

          {/* Rejim tugmalari */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'explain', label: '📖 Tushuntirish', desc: 'Mavzuni chuqur tushuntiradi' },
              { id: 'hint', label: '💡 Maslahat', desc: 'Yechim yo\'lini ko\'rsatadi' },
              { id: 'practice', label: '🎯 Mashq (foiz)', desc: '5 ta savol, foiz hisobi' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setRequestType(m.id);
                  if (m.id === 'practice') {
                    setPracticeAnswerCount(0);
                    setPracticeCorrect(0);
                    // Mashq rejimi uchun maxsus xabar
                    setMessages(prev => [...prev, {
                      sender: 'assistant',
                      content: `🎯 **Mashq sinov rejimi** yoqildi!\n\nMen sizga ${selectedSubject} fanidan ketma-ket **5 ta savol** beraman. Har bir savolingizga javob yozing. Oxirida **necha foiz o'zlashtirganligi** hisoblab ko'rsataman.\n\nBoshlash uchun: **"Savol ber"** deb yozing yoki quyidagilardan birini so'rang!`
                    }]);
                  } else if (m.id === 'hint') {
                    setMessages(prev => [...prev, {
                      sender: 'assistant',
                      content: `💡 **Maslahat rejimi** yoqildi!\n\nMen sizga tayyor javob bermayman — buning o'rniga o'ylashga yo'naltiruvchi **maslahatlar (hint)** beraman. Bu sizning mustaqil fikrlash qobiliyatingizni rivojlantiradi!\n\nQaysi masala yoki mavzu bo'yicha maslahat kerak?`
                    }]);
                  } else {
                    setMessages(prev => [...prev, {
                      sender: 'assistant',
                      content: `📖 **Tushuntirish rejimi** yoqildi!\n\nMen mavzularni xuddi **daftarga yozgandek** — qadam-baqadam, misollar bilan, aniq va tushunarli qilib tushuntiraman.\n\nQaysi mavzuni tushuntiray?`
                    }]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  requestType === m.id
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                title={m.desc}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Xabarlar lentasi */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div key={index} className={`flex gap-3 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                    isBot ? 'bg-violet-600' : 'bg-blue-700'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                    isBot
                      ? 'bg-slate-50 border border-slate-200 text-slate-800'
                      : 'bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {isBot ? (
                    <div>
                      <MathRenderer content={msg.content} />

                      {/* Hints ko'rsatish */}
                      {msg.hints && msg.hints.length > 0 && (
                        <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            Muhim maslahat:
                          </span>
                          <ul className="text-xs text-amber-800 mt-1 list-disc list-inside">
                            {msg.hints.map((h, i) => <li key={i}>{h}</li>)}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up takliflar */}
                      {msg.follow_ups && msg.follow_ups.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {msg.follow_ups.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleSend(q)}
                              className="text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition text-left"
                            >
                              → {q}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action buttons (Nusxa olish, Fikr bildirish) */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-400">
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1 hover:text-slate-700 transition"
                        >
                          {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIndex === index ? 'Nusxalandi' : 'Nusxa olish'}</span>
                        </button>

                        {msg.id && (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={feedbackSent[msg.id]}
                              onClick={() => handleFeedback(msg.id!, true)}
                              className={`p-1 rounded hover:bg-slate-200 transition ${feedbackSent[msg.id] ? 'text-emerald-600' : ''}`}
                              title="Foydali javob"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={feedbackSent[msg.id]}
                              onClick={() => handleFeedback(msg.id!, false)}
                              className="p-1 rounded hover:bg-slate-200 transition text-slate-400 hover:text-red-500"
                              title="Xato yoki tushunarsiz"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                <span>EduAI tushuntirishni tayyorlamoqda...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Tezkor mavzular (Chips) */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 shrink-0 font-medium">Namunaviy savollar:</span>
          {[
            "Kasrlarni qanday qo'shish kerak?",
            "3x - 12 = 0 tenglamani yechib ber",
            "Present Continuous zamoni formulasi",
            "Sonning foizini topish qoidasi"
          ].map((sample, i) => (
            <button
              key={i}
              onClick={() => { setInputQuestion(sample); }}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-slate-600 hover:text-blue-700 whitespace-nowrap transition"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={e => setInputQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Mavzu yoki savolingizni yozing (masalan: 4x + 8 = 24 tenglamani tushuntir)..."
            className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || isSending}
            className="p-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>

    </div>
    </div>
  );
};
