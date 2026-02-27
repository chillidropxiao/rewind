import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Quote, ListTodo, Brain, Plus, Trash2, Clock, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { storage } from '../services/storage';

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
}

interface DiaryResult {
  log: string;
  insights: string;
  quote: string;
}

interface SummarizedActivity {
  name: string;
  duration: number;
  isMultiple: boolean;
}

export default function DailyReview() {
  const [step, setStep] = useState<'schedule' | 'selection' | 'reflection' | 'result'>('schedule');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: '1', startTime: '09:00', endTime: '10:00', activity: '' }
  ]);
  const [aiSummarizedActivities, setAiSummarizedActivities] = useState<SummarizedActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [reflectionAnswers, setReflectionAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [result, setResult] = useState<DiaryResult | null>(null);

  // The activity chosen by the user for reflection
  const focusActivity = useMemo(() => {
    const selected = aiSummarizedActivities.find(item => item.name === selectedActivityId);
    if (!selected) return null;
    return {
      activity: selected.name,
      startTime: '', // AI summarized doesn't have a single start/end
      endTime: ''
    };
  }, [aiSummarizedActivities, selectedActivityId]);

  const handleAddSchedule = () => {
    const lastItem = schedule[schedule.length - 1];
    const newStart = lastItem ? lastItem.endTime : '09:00';
    const [h, m] = newStart.split(':').map(Number);
    const newEnd = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setSchedule([...schedule, { id: Math.random().toString(36).substr(2, 9), startTime: newStart, endTime: newEnd, activity: '' }]);
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const updateSchedule = (id: string, field: keyof ScheduleItem, value: string) => {
    setSchedule(schedule.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const goToSelection = async () => {
    if (schedule.some(s => !s.activity)) return;
    
    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const scheduleData = schedule.map(s => ({
        time: `${s.startTime}-${s.endTime}`,
        activity: s.activity
      }));

      const prompt = `
        请分析以下用户的今日日程流水账，并进行分类汇总：
        1. 识别语义上属于“同一件事情”的事项（例如“写代码”和“编写程序”应合并）。
        2. 计算每一类事项的合计时间（分钟）。
        3. 如果多个事项在时间段上有重叠，请将该时间段平均分配给这些事项。
        4. 识别该事项是否由多个时间段累计而成。

        日程数据：
        ${JSON.stringify(scheduleData, null, 2)}

        请以JSON数组格式返回，每个对象包含：
        - name: 汇总后的事项名称（取最具有代表性的名称）
        - duration: 合计分钟数（整数）
        - isMultiple: 是否由多次活动累计而成（布尔值）

        按耗时从高到低排序。
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const summarized = JSON.parse(response.text || '[]');
      setAiSummarizedActivities(summarized);
      setStep('selection');
    } catch (error) {
      console.error('Error summarizing schedule:', error);
      // Fallback to simple logic if AI fails
      const fallback = schedule.map(s => ({ name: s.activity, duration: 60, isMultiple: false }));
      setAiSummarizedActivities(fallback);
      setStep('selection');
    } finally {
      setIsSummarizing(false);
    }
  };

  const startReflection = async () => {
    if (!focusActivity || !focusActivity.activity) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        用户选择的今日重点事项是：“${focusActivity.activity}”（从 ${focusActivity.startTime} 到 ${focusActivity.endTime}）。
        请针对这个事项，提出 3-5 个深刻的复盘问题，引导用户还原事项细节、反思得失并总结经验。
        问题应该具有启发性，符合科学复盘方法。
        请以JSON数组格式返回，例如：["问题1", "问题2", ...]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const qList = JSON.parse(response.text || '[]');
      setQuestions(qList);
      setReflectionAnswers(new Array(qList.length).fill(''));
      setCurrentQuestionIndex(0);
      setStep('reflection');
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions(['这件事的目标是什么？', '过程中遇到了什么挑战？', '最后的结果如何？', '有什么可以改进的地方？']);
      setReflectionAnswers(new Array(4).fill(''));
      setCurrentQuestionIndex(0);
      setStep('reflection');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDiary = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const scheduleText = schedule.map(s => `${s.startTime}-${s.endTime}: ${s.activity}`).join('\n');
      const reflectionText = questions.map((q, i) => `问：${q}\n答：${reflectionAnswers[i]}`).join('\n\n');

      const prompt = `
        基于以下复盘内容，生成一份每日复盘日记。
        内容包括：
        1. 今日流水账 (log): 整理成简洁优美的日程回顾。
        2. 经验沉淀 (insights): 结合用户的深度反思，总结核心经验和未来行动点。
        3. 每日一签 (quote): 生成一句富有哲理的短句。

        日程：
        ${scheduleText}

        深度反思（针对重点事项“${focusActivity?.activity}”）：
        ${reflectionText}

        请以JSON格式返回：
        {
          "log": "...",
          "insights": "...",
          "quote": "..."
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const jsonResult = JSON.parse(response.text || '{}');
      setResult(jsonResult);
      setStep('result');
    } catch (error) {
      console.error('Error generating diary:', error);
      setResult({
        log: schedule.map(s => s.activity).join(', '),
        insights: '保持思考，持续进步。',
        quote: '复盘是成长的捷径。'
      });
      setStep('result');
    } finally {
      setIsGenerating(false);
    }
  };

  if (step === 'result' && result) {
    return <DiaryView result={result} onReset={() => { setStep('schedule'); setSchedule([{ id: '1', startTime: '09:00', endTime: '10:00', activity: '' }]); setSelectedActivityId(null); setResult(null); }} />;
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-3xl">
        {step === 'schedule' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 1</span>
                <h2 className="text-2xl font-display font-medium text-slate-800 mt-1">今日流水账</h2>
                <p className="text-sm text-slate-500 mt-2 font-light">记录今天的时间分配，帮助您回忆起重要事项。</p>
              </div>
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">取消复盘</Link>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {schedule.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-2 text-slate-400">
                      <input 
                        type="time" 
                        value={item.startTime} 
                        onChange={(e) => updateSchedule(item.id, 'startTime', e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-xs font-medium p-0 w-14"
                      />
                      <span className="text-[10px] opacity-30">—</span>
                      <input 
                        type="time" 
                        value={item.endTime} 
                        onChange={(e) => updateSchedule(item.id, 'endTime', e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-xs font-medium p-0 w-14"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="做了什么？"
                      value={item.activity}
                      onChange={(e) => updateSchedule(item.id, 'activity', e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-300 font-light"
                    />
                    <button 
                      onClick={() => handleRemoveSchedule(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleAddSchedule}
                className="w-full py-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all border-t border-slate-100"
              >
                <Plus className="w-3 h-3" /> 添加事项
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={goToSelection}
                disabled={schedule.length === 0 || schedule.some(s => !s.activity) || isSummarizing}
                className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 flex items-center gap-2"
              >
                {isSummarizing ? (
                  <>正在智能汇总... <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>下一步：选择重点事项 <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        ) : step === 'selection' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 2</span>
                <h2 className="text-2xl font-display font-medium text-slate-800 mt-1">选择今日重点</h2>
                <p className="text-sm text-slate-500 mt-2 font-light">AI 已为您智能汇总日程。请选择一个最值得复盘的事项。</p>
              </div>
              <button onClick={() => setStep('schedule')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">返回修改日程</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {aiSummarizedActivities.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedActivityId(item.name)}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border transition-all text-left group",
                    selectedActivityId === item.name 
                      ? "bg-slate-800 border-slate-800 text-white shadow-md" 
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-xs font-medium",
                      selectedActivityId === item.name ? "bg-white/10" : "bg-slate-50 text-slate-400"
                    )}>
                      {item.duration}m
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        selectedActivityId === item.name ? "text-slate-300" : "text-slate-400"
                      )}>
                        {item.isMultiple ? '多次累计' : '单次事项'}
                      </p>
                    </div>
                  </div>
                  {selectedActivityId === item.name && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep('schedule')}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> 上一步
              </button>
              <button
                onClick={startReflection}
                disabled={!selectedActivityId || isGenerating}
                className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 flex items-center gap-2"
              >
                {isGenerating ? '正在生成问题...' : '开始深度反思'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 3: 深度反思</span>
                <h2 className="text-2xl font-display font-medium text-slate-800 mt-1">针对重点事项：{focusActivity?.activity}</h2>
                <p className="text-sm text-slate-500 mt-2 font-light">问题 {currentQuestionIndex + 1} / {questions.length}</p>
              </div>
              <button onClick={() => setStep('selection')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">重新选择事项</button>
            </div>

            <div className="space-y-6">
              <p className="text-lg text-slate-700 font-light leading-relaxed">{questions[currentQuestionIndex]}</p>
              <textarea
                autoFocus
                className="w-full min-h-[200px] p-6 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 transition-colors text-slate-700 font-light resize-none leading-relaxed"
                placeholder="在此输入您的回答..."
                value={reflectionAnswers[currentQuestionIndex]}
                onChange={(e) => {
                  const newAnswers = [...reflectionAnswers];
                  newAnswers[currentQuestionIndex] = e.target.value;
                  setReflectionAnswers(newAnswers);
                }}
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  currentQuestionIndex === 0 ? "text-transparent pointer-events-none" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <ArrowLeft className="w-4 h-4" /> 上一个问题
              </button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={!reflectionAnswers[currentQuestionIndex].trim()}
                  className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 flex items-center gap-2"
                >
                  下一个问题 <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={generateDiary}
                  disabled={!reflectionAnswers[currentQuestionIndex].trim() || isGenerating}
                  className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 flex items-center gap-2"
                >
                  {isGenerating ? '正在生成日记...' : '生成复盘日记'}
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DiaryView({ result, onReset }: { result: DiaryResult, onReset: () => void }) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    storage.saveReview({
      type: 'daily',
      log: result.log,
      insights: result.insights,
      quote: result.quote,
    });
    setIsSaved(true);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 py-16 px-6 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm"
      >
        <div className="p-10 md:p-16 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Daily Review Diary</span>
            <h1 className="text-2xl font-display font-medium text-slate-800">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h1>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ListTodo className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">今日流水</h3>
            </div>
            <div className="pl-6 border-l border-slate-100">
              <p className="text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{result.log}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Brain className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-widest">经验沉淀</h3>
            </div>
            <div className="pl-6 border-l border-slate-100">
              <p className="text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{result.insights}</p>
            </div>
          </section>

          <section className="pt-8 border-t border-slate-50 flex flex-col items-center text-center">
            <Quote className="w-6 h-6 text-slate-200 mb-6" />
            <p className="text-xl font-display italic text-slate-700 leading-relaxed max-w-md">“{result.quote}”</p>
            <span className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-300 font-bold">— 每日一签 —</span>
          </section>

          <div className="pt-12 flex justify-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSaved}
              className={cn(
                "btn-minimal flex items-center gap-2",
                isSaved ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-800 text-white hover:bg-slate-700"
              )}
            >
              {isSaved ? <><Check className="w-4 h-4" /> 已存入知识库</> : '存入知识库'}
            </button>
            <button 
              onClick={onReset}
              className="btn-minimal bg-slate-50 text-slate-500 hover:bg-slate-100"
            >
              重新复盘
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
