import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { GalleryItem } from '../context/AppContext';
import { Trash2, Edit2, Download, Copy, Image, Check, Tag } from 'lucide-react';

export const Gallery: React.FC = () => {
  const { gallery, deleteFromGallery, importToStudio } = useApp();
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = ['all', ...Array.from(new Set(gallery.flatMap(item => item.tags)))];

  const handleCopy = async (item: GalleryItem) => {
    try {
      const response = await fetch(item.dataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopySuccessId(item.id);
      setTimeout(() => setCopySuccessId(null), 2000);
    } catch (err) {
      console.error(err);
      alert('您的浏览器可能不支持复制图片到剪贴板，请尝试点击下载图片按钮！');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要从本地库删除这张图片吗？此操作无法撤销。')) {
      await deleteFromGallery(id);
    }
  };

  const handleDownload = (item: GalleryItem) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = `${item.title.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.click();
  };

  // Filter gallery
  const filteredGallery = selectedTag === 'all'
    ? gallery
    : gallery.filter(item => item.tags.includes(selectedTag));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">我的画廊</h1>
        <p className="page-subtitle">管理本地 IndexedDB 存储的照片与自制表情包，安全隐私，支持离线</p>
      </div>

      {/* Tags Filter bar */}
      {gallery.length > 0 && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <Tag style={{ width: 16 }} />
            按标签筛选：
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === 'all' ? '全部图片' : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid gallery */}
      {filteredGallery.length === 0 ? (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
          <Image style={{ width: 60, height: 60, strokeWidth: 1.25, color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
          {gallery.length === 0 ? (
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>您的画廊空空如也</h3>
              <p style={{ fontSize: '0.85rem' }}>在“搜图中心”、“AI生图”或“创意画坊”中完成制作后，点击“收藏”即可永久保存在此。</p>
            </div>
          ) : (
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>没有匹配该标签的图片</h3>
              <p style={{ fontSize: '0.85rem' }}>点击上方的“全部图片”按钮以查看完整图库。</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredGallery.map((item) => (
            <div
              key={item.id}
              className="glass-panel animate-fade-in"
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.3s, border-color 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = 'var(--border-color-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {/* Image Preview Box */}
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#0a0a14' }}>
                <img
                  src={item.dataUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />

                {/* Color Dot Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                  title={`平均颜色: RGB(${item.color.r}, ${item.color.g}, ${item.color.b})`}
                />
              </div>

              {/* Text metadata */}
              <div style={{ padding: '8px 5px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {item.date}
                </span>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {item.tags.map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Card Operations */}
                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: '1', padding: '0.45rem', fontSize: '0.8rem' }}
                    onClick={() => importToStudio(item.dataUrl)}
                    title="导入 Studio 再次编辑"
                  >
                    <Edit2 style={{ width: 14, marginRight: '4px' }} />
                    编辑
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem' }}
                    onClick={() => handleCopy(item)}
                    title="复制到剪贴板，支持微信直接粘贴"
                  >
                    {copySuccessId === item.id ? <Check style={{ width: 14, color: 'var(--success)' }} /> : <Copy style={{ width: 14 }} />}
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem' }}
                    onClick={() => handleDownload(item)}
                    title="下载本地"
                  >
                    <Download style={{ width: 14 }} />
                  </button>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem', color: 'var(--danger)' }}
                    onClick={() => handleDelete(item.id)}
                    title="删除"
                  >
                    <Trash2 style={{ width: 14 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
