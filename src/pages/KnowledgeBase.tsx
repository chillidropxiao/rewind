import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, ReviewItem, DailyReviewItem, DeepReviewItem, KnowledgeItem } from '../services/storage';
import { Calendar, BarChart2, BookOpen, Clock, Quote, ChevronRight, Search } from 'lucide-react';
import { cn } from '../lib/utils';

type TabType = 'daily' | 'deep' | 'knowledge';

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setReviews(storage.getReviews());
  }, []);

  const filteredReviews = reviews
    .filter(r => r.type === activeTab)
    .filter(r => {
      if (!searchQuery) return true;
      const content = 'title' in r ? r.title + r.content : r.log + r.insights + r.quote;
      return content.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-display font-medium text-slate-800 mb-2">知识库</h1>
            <p className="text-slate-500 font-light">沉淀每一次思考，见证成长的足迹。</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索复盘内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400 transition-colors w-full md:w-64"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
          <TabButton 
            active={activeTab === 'daily'} 
            onClick={() => setActiveTab('daily')}
            icon={<Calendar className="w-4 h-4" />}
            label="每日复盘"
          />
          <TabButton 
            active={activeTab === 'deep'} 
            onClick={() => setActiveTab('deep')}
            icon={<BarChart2 className="w-4 h-4" />}
            label="深度复盘"
          />
          <TabButton 
            active={activeTab === 'knowledge'} 
            onClick={() => setActiveTab('knowledge')}
            icon={<BookOpen className="w-4 h-4" />}
            label="复盘知识库"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="wait">
            {filteredReviews.length > 0 ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center"
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-light">暂无相关记录</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative whitespace-nowrap",
        active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800"
        />
      )}
    </button>
  );
}

const ReviewCard: React.FC<{ review: ReviewItem }> = ({ review }) => {
  const dateStr = new Date(review.date).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (review.type === 'daily') {
    return (
      <div className="group bg-white border border-slate-100 p-6 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-800">{dateStr} 每日复盘</h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Daily Reflection</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-500 line-clamp-2 font-light leading-relaxed italic">
            “{review.quote}”
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-2 py-1 bg-slate-50 text-slate-400 rounded-md font-medium">经验沉淀</span>
            <span className="text-[10px] px-2 py-1 bg-slate-50 text-slate-400 rounded-md font-medium">今日流水</span>
          </div>
        </div>
      </div>
    );
  }

  const title = 'title' in review ? review.title : '';
  const content = 'content' in review ? review.content : '';

  return (
    <div className="group bg-white border border-slate-100 p-6 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
            {review.type === 'deep' ? <BarChart2 className="w-4 h-4 text-slate-400" /> : <BookOpen className="w-4 h-4 text-slate-400" />}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-800">{title}</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{dateStr}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>
      <p className="text-sm text-slate-500 line-clamp-2 font-light leading-relaxed">
        {content}
      </p>
    </div>
  );
}
