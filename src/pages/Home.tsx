import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Clock, Target, Zap, Calendar, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-4xl md:text-5xl font-display font-medium text-slate-800 mb-8 tracking-tight leading-[1.1]">
                回顾，是为了更清晰地<span className="text-slate-400">前行</span>
              </h1>
              <p className="text-base text-slate-500 max-w-xl mb-12 leading-relaxed font-light">
                Rewind 是一个极简主义复盘工具。
                在喧嚣的世界中，为您提供一个静谧的思考空间，将碎片化的经历转化为结构化的智慧。
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-6"
            >
              <Link
                to="/daily"
                className="btn-minimal bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
              >
                每日复盘
              </Link>
              <Link
                to="/deep"
                className="btn-minimal bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              >
                深度复盘
              </Link>
              <Link
                to="/knowledge"
                className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
              >
                知识库
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <FeatureCard
              title="每日反思"
              description="在日落之时，用三两分钟审视今日。捕捉细微的进步，记录真实的心境。"
            />
            <FeatureCard
              title="深度复盘"
              description="针对重大项目或周期性目标。剥离表象，探寻底层逻辑，建立长效机制。"
            />
            <FeatureCard
              title="智慧沉淀"
              description="经验不应只是记忆。通过结构化整理，让过去的每一个足迹都成为未来的基石。"
            />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-8">我们的愿景</h2>
            <p className="text-2xl text-slate-700 leading-relaxed font-light italic">
              “我们不从经验中学习，我们从对经验的反思中学习。”
            </p>
            <p className="mt-12 text-slate-500 leading-relaxed font-light">
              Rewind 致力于构建一个纯粹的思考场域。没有冗余的功能，只有专注于自我成长的对话。
              我们相信，最好的工具应该是隐形的，它只是静静地陪伴在您的思考路径上。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="group">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 tracking-wide uppercase">{title}</h3>
      <p className="text-slate-500 leading-relaxed font-light text-sm">{description}</p>
    </div>
  );
}
