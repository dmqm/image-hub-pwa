import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { GalleryItem } from '../context/AppContext';
import { Trash2, Download, Copy, Image, Check, Tag } from 'lucide-react';

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
        <h1 className="page-title">本地画廊</h1>
      </div>

      {/* Tags Filter bar */}
      {gallery.length > 0 && (
        <div className="glass-panel" style={{ padding: '0.5rem 0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Tag style={{ width: 14 }} />
            分类：
          </span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`btn ${selectedTag === tag ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px' }}
                onClick={() => setSelectedTag(tag)}
              >
                {tag === 'all' ? '全部' : `#${tag}`}
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
              <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#0a0a14' }}>
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
                    top: '6px',
                    right: '6px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
                    border: '1.5px solid #ffffff',
                  }}
                />
              </div>

              {/* Text metadata */}
              <div style={{ padding: '6px 2px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </h3>
                
                {/* Tags (max 2) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                  {item.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} style={{ fontSize: '0.65rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '1px 4px', borderRadius: '3px' }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Card Operations */}
                <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: '1', padding: '4px 0', fontSize: '0.75rem' }}
                    onClick={() => importToStudio(item.dataUrl)}
                  >
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
