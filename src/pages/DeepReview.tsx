import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Map, Flag, Target, User, MessageSquare, Lightbulb, Save, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../lib/utils';
import { storage } from '../services/storage';

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  question: string;
  isCompleted: boolean;
  answer: string;
}

interface DeepReviewReport {
  title: string;
  summary: string;
  lessons: string;
  nextSteps: string;
}

export default function DeepReview() {
  const [step, setStep] = useState<'setup' | 'planning' | 'review' | 'summary'>('setup');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('30'); // minutes
  const [roadmap, setRoadmap] = useState<RoadmapNode[]>([]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<DeepReviewReport | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const navigate = useNavigate();

  const handleStartPlanning = async () => {
    if (!subject.trim()) return;
    setStep('planning');
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        用户想要进行深度复盘。
        复盘事项：${subject}
        预计耗时：${duration} 分钟
        
        请根据事项和时间，规划一个科学的复盘路线图。路线图应包含 5-7 个关键节点。
        必须包含以下核心维度（但可以根据具体事项调整措辞）：
        1. 目前状态 (现状是什么)
        2. 预期目标与实际结果 (结果是什么)
        3. 执行过程回顾 (项目是怎么做的)
        4. 个人角色与贡献 (承担了什么工作)
        5. 成功与失败因素分析 (好或不好的原因)
        6. 认知校验 (思考自己的感觉是否正确)
        7. 未来行动建议
        
        请以JSON数组格式返回，每个对象包含 id, title, description, question。
        示例：[{"id": "1", "title": "...", "description": "...", "question": "..."}]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const nodes = JSON.parse(response.text || '[]');
      setRoadmap(nodes.map((n: any) => ({ ...n, isCompleted: false, answer: '' })));
      setStep('review');
    } catch (error) {
      console.error('Planning error:', error);
      // Fallback roadmap
      const fallbackNodes = [
        { id: '1', title: '目标回顾', description: '回顾最初设定的目标', question: '最初的目标是什么？实际达成了多少？', isCompleted: false, answer: '' },
        { id: '2', title: '过程梳理', description: '梳理执行的关键环节', question: '整个项目是如何推进的？关键节点有哪些？', isCompleted: false, answer: '' },
        { id: '3', title: '角色审视', description: '分析个人在其中的作用', question: '你承担了什么角色？完成了哪些具体工作？', isCompleted: false, answer: '' },
        { id: '4', title: '得失分析', description: '总结做得好与不好的地方', question: '哪些地方做得好？哪些地方不尽如人意？原因是什么？', isCompleted: false, answer: '' },
        { id: '5', title: '经验萃取', description: '沉淀可迁移的经验', question: '从这次经历中你学到了什么？未来如何应用？', isCompleted: false, answer: '' },
      ];
      setRoadmap(fallbackNodes);
      setStep('review');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeComplete = () => {
    const newRoadmap = [...roadmap];
    newRoadmap[currentNodeIndex].isCompleted = true;
    setRoadmap(newRoadmap);

    if (currentNodeIndex < roadmap.length - 1) {
      setCurrentNodeIndex(currentNodeIndex + 1);
    } else {
      generateReport();
    }
  };

  const generateReport = async () => {
    setStep('summary');
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const reviewContent = roadmap.map(n => `${n.title}: ${n.answer}`).join('\n\n');
      
      const prompt = `
        基于以下深度复盘的内容，生成一份专业的复盘经验报告。
        事项：${subject}
        
        复盘详情：
        ${reviewContent}
        
        请以JSON格式返回，包含以下字段：
        - title: 报告标题
        - summary: 复盘总结（简洁有力）
        - lessons: 核心经验沉淀（结构化）
        - nextSteps: 未来行动建议
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setReport(result);
    } catch (error) {
      console.error('Report generation error:', error);
      setReport({
        title: `${subject} 复盘报告`,
        summary: '复盘已完成，经验已萃取。',
        lessons: '保持反思，持续进化。',
        nextSteps: '将经验应用到下一个项目中。'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToKnowledge = () => {
    if (!report) return;
    storage.saveReview({
      type: 'deep',
      title: report.title,
      content: `${report.summary}\n\n经验沉淀：\n${report.lessons}\n\n后续行动：\n${report.nextSteps}`,
    });
    setIsSaved(true);
  };

  const progress = (roadmap.filter(n => n.isCompleted).length / roadmap.length) * 100;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto space-y-10"
            >
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-display font-medium text-slate-800">开启深度复盘</h1>
                <p className="text-slate-500 font-light">针对重大事项进行系统性拆解，探寻底层逻辑。</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">复盘事项</label>
                  <input
                    type="text"
                    placeholder="例如：Q1 营销项目、某次重要的客户沟通..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-slate-400 transition-colors text-slate-700 font-light"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">预计投入时间 (分钟)</label>
                  <div className="flex gap-4">
                    {['15', '30', '60', '120'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setDuration(t)}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-sm font-medium transition-all",
                          duration === t ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        )}
                      >
                        {t}m
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartPlanning}
                  disabled={!subject.trim()}
                  className="w-full py-4 bg-slate-800 text-white rounded-2xl font-medium hover:bg-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  规划复盘路线图
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
              <div className="text-center space-y-2">
                <p className="text-slate-800 font-medium">正在为您规划路线图...</p>
                <p className="text-slate-400 text-sm font-light">AI 正在根据事项性质和时间，匹配最合适的复盘方法论。</p>
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              {/* Sidebar: Roadmap */}
              <div className="lg:col-span-1 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">复盘路线图</h3>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-slate-800"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="relative space-y-6">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-100" />
                  
                  {roadmap.map((node, index) => (
                    <div key={node.id} className="relative flex items-start gap-4">
                      <div className={cn(
                        "z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                        node.isCompleted ? "bg-slate-800 text-white" : 
                        index === currentNodeIndex ? "bg-white border-2 border-slate-800 text-slate-800" : 
                        "bg-white border border-slate-200 text-slate-300"
                      )}>
                        {node.isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                      </div>
                      <div className={cn(
                        "flex-1 pt-1 transition-opacity",
                        index === currentNodeIndex ? "opacity-100" : "opacity-40"
                      )}>
                        <h4 className="text-sm font-medium text-slate-800">{node.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{node.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main: Question Area */}
              <div className="lg:col-span-2 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-medium">节点 {currentNodeIndex + 1}: {roadmap[currentNodeIndex].title}</span>
                  </div>
                  <h2 className="text-2xl font-display font-medium text-slate-800 leading-tight">
                    {roadmap[currentNodeIndex].question}
                  </h2>
                  <textarea
                    autoFocus
                    className="w-full min-h-[300px] p-8 bg-white border border-slate-200 rounded-[32px] focus:outline-none focus:border-slate-400 transition-colors text-slate-700 font-light resize-none leading-relaxed shadow-sm"
                    placeholder="请详细描述您的思考..."
                    value={roadmap[currentNodeIndex].answer}
                    onChange={(e) => {
                      const newRoadmap = [...roadmap];
                      newRoadmap[currentNodeIndex].answer = e.target.value;
                      setRoadmap(newRoadmap);
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setCurrentNodeIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentNodeIndex === 0}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors",
                      currentNodeIndex === 0 ? "text-transparent pointer-events-none" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" /> 上一个节点
                  </button>
                  
                  <button
                    onClick={handleNodeComplete}
                    disabled={!roadmap[currentNodeIndex].answer.trim() || isGenerating}
                    className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 flex items-center gap-2"
                  >
                    {currentNodeIndex === roadmap.length - 1 ? '完成复盘' : '点亮此节点'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'summary' && report && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-[40px] overflow-hidden shadow-sm"
            >
              <div className="p-12 md:p-20 space-y-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-slate-800" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-bold">Deep Review Report</span>
                  <h1 className="text-3xl font-display font-medium text-slate-800">{report.title}</h1>
                </div>

                <div className="space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">复盘总结</h3>
                    <p className="text-slate-600 font-light leading-relaxed text-lg">{report.summary}</p>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">经验沉淀</h3>
                    <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                      <p className="text-slate-600 font-light leading-relaxed whitespace-pre-wrap">{report.lessons}</p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">后续行动</h3>
                    <p className="text-slate-600 font-light leading-relaxed">{report.nextSteps}</p>
                  </section>
                </div>

                <div className="pt-12 flex justify-center gap-6">
                  <button
                    onClick={handleSaveToKnowledge}
                    disabled={isSaved}
                    className={cn(
                      "btn-minimal flex items-center gap-2",
                      isSaved ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-800 text-white hover:bg-slate-700"
                    )}
                  >
                    {isSaved ? <><Check className="w-4 h-4" /> 已存入知识库</> : <><Save className="w-4 h-4" /> 存入知识库</>}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn-minimal bg-slate-50 text-slate-500 hover:bg-slate-100"
                  >
                    回到首页
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
