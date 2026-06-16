import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Laugh, Sliders, Image, ArrowRight } from 'lucide-react';

export const ToolsPortal: React.FC = () => {
  const { setActiveSubTool } = useApp();

  const tools = [
    {
      id: 'ai' as const,
      title: 'AI 绘画',
      desc: '输入创意描述，AI 快速作画',
      icon: Sparkles,
      color: 'linear-gradient(135deg, #6366f1, #a855f7)',
      shadow: 'rgba(99, 102, 241, 0.2)'
    },
    {
      id: 'meme' as const,
      title: '表情包制作',
      desc: '多图层拖拽，添加恶搞贴纸',
      icon: Laugh,
      color: 'linear-gradient(135deg, #a855f7, #ec4899)',
      shadow: 'rgba(168, 85, 247, 0.2)'
    },
    {
      id: 'studio' as const,
      title: '画室 Studio',
      desc: '滤镜调节、手写涂鸦与旋转',
      icon: Sliders,
      color: 'linear-gradient(135deg, #06b6d4, #10b981)',
      shadow: 'rgba(6, 182, 212, 0.2)'
    },
    {
      id: 'creator' as const,
      title: '创意画坊',
      desc: '头像框挂件、水印与语录卡片',
      icon: Image,
      color: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      shadow: 'rgba(245, 158, 11, 0.2)'
    }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">创意工坊</h1>
        <p className="page-subtitle">一站式手机端创作中心，释放您的无限想象力</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tools.map((t) => {
          const IconComponent = t.icon;
          return (
            <div
              key={t.id}
              onClick={() => setActiveSubTool(t.id)}
              className="glass-panel"
              style={{
                margin: 0,
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Glow Effect */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-20%',
                  width: '120px',
                  height: '120px',
                  background: t.color,
                  opacity: 0.05,
                  filter: 'blur(30px)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />

              {/* Icon Container */}
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: 'var(--radius-md)',
                  background: t.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: `0 4px 12px ${t.shadow}`,
                  flexShrink: 0
                }}
              >
                <IconComponent style={{ width: 24, height: 24 }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {t.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {t.desc}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight style={{ width: 18, color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
