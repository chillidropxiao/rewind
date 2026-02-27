import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Settings, 
  Award, 
  Calendar, 
  TrendingUp, 
  Shield, 
  LogOut, 
  ChevronRight, 
  BookOpen, 
  Target,
  Clock,
  Download,
  Trash2
} from 'lucide-react';
import { storage, ReviewItem } from '../services/storage';
import { cn } from '../lib/utils';

export default function Profile() {
  const reviews = useMemo(() => storage.getReviews(), []);
  
  const stats = useMemo(() => {
    const dailyCount = reviews.filter(r => r.type === 'daily').length;
    const deepCount = reviews.filter(r => r.type === 'deep').length;
    const knowledgeCount = reviews.filter(r => r.type === 'knowledge').length;
    
    // Simple streak calculation (mocked for now based on total reviews)
    const streak = dailyCount > 0 ? Math.min(dailyCount, 7) : 0; 
    
    return {
      total: reviews.length,
      daily: dailyCount,
      deep: deepCount,
      knowledge: knowledgeCount,
      streak
    };
  }, [reviews]);

  const achievements = [
    { id: 1, title: '初露锋芒', description: '完成第 1 次复盘', icon: <Award className="w-5 h-5" />, unlocked: stats.total >= 1 },
    { id: 2, title: '深度思考者', description: '完成 3 次深度复盘', icon: <Target className="w-5 h-5" />, unlocked: stats.deep >= 3 },
    { id: 3, title: '持之以恒', description: '连续 7 天进行复盘', icon: <TrendingUp className="w-5 h-5" />, unlocked: stats.streak >= 7 },
    { id: 4, title: '博学多才', description: '知识库条目达到 10 条', icon: <BookOpen className="w-5 h-5" />, unlocked: stats.knowledge >= 10 },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-50/50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-slate-50">
            <User className="w-12 h-12 text-slate-300" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-2xl font-display font-medium text-slate-800">Rewind 用户</h1>
            <p className="text-slate-400 font-light text-sm">探索自我，记录成长。自 2026 年 2 月加入。</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-100">
                初级复盘者
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
                已认证
              </span>
            </div>
          </div>
          <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="总复盘数" value={stats.total} icon={<TrendingUp className="w-4 h-4" />} color="slate" />
          <StatCard label="每日复盘" value={stats.daily} icon={<Calendar className="w-4 h-4" />} color="blue" />
          <StatCard label="深度复盘" value={stats.deep} icon={<Target className="w-4 h-4" />} color="purple" />
          <StatCard label="当前连击" value={`${stats.streak} 天`} icon={<Clock className="w-4 h-4" />} color="emerald" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Achievements */}
          <section className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">成就勋章</h3>
              <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">查看全部</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={cn(
                    "p-6 rounded-3xl border transition-all flex items-center gap-4",
                    achievement.unlocked ? "bg-white border-slate-200" : "bg-slate-50/50 border-slate-100 grayscale opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    achievement.unlocked ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-400"
                  )}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-800">{achievement.title}</h4>
                    <p className="text-xs text-slate-400 font-light mt-0.5">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions & Settings */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">系统设置</h3>
            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-50">
                <MenuButton icon={<Shield className="w-4 h-4" />} label="隐私与安全" />
                <MenuButton icon={<Download className="w-4 h-4" />} label="导出复盘数据" />
                <MenuButton icon={<Trash2 className="w-4 h-4" />} label="清空本地缓存" danger />
                <MenuButton icon={<LogOut className="w-4 h-4" />} label="退出登录" />
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[24px] shadow-sm space-y-3">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center",
        color === 'blue' ? "bg-blue-50 text-blue-500" :
        color === 'purple' ? "bg-purple-50 text-purple-500" :
        color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
        "bg-slate-50 text-slate-500"
      )}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-display font-medium text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, danger }: { icon: React.ReactNode, label: string, danger?: boolean }) {
  return (
    <button className={cn(
      "w-full px-6 py-4 flex items-center justify-between group transition-colors",
      danger ? "hover:bg-red-50" : "hover:bg-slate-50"
    )}>
      <div className="flex items-center gap-3">
        <span className={cn(
          "transition-colors",
          danger ? "text-red-400 group-hover:text-red-500" : "text-slate-400 group-hover:text-slate-600"
        )}>
          {icon}
        </span>
        <span className={cn(
          "text-sm font-light transition-colors",
          danger ? "text-red-500" : "text-slate-600"
        )}>
          {label}
        </span>
      </div>
      <ChevronRight className={cn(
        "w-4 h-4 transition-all",
        danger ? "text-red-200 group-hover:text-red-400" : "text-slate-200 group-hover:text-slate-400 group-hover:translate-x-1"
      )} />
    </button>
  );
}
