import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ColorTheme } from '../context/AppContext';
import { Key, Database, Trash2, Smartphone, Download, Upload, Palette, Check } from 'lucide-react';
import localforage from 'localforage';

export const SettingsPanel: React.FC = () => {
  const {
    theme, setTheme,
    siliconFlowKey, setSiliconFlowKey,
    deepSeekKey, setDeepSeekKey,
    pixabayKey, setPixabayKey,
    exportBackupData, importBackupData
  } = useApp();

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleClearDatabase = async () => {
    if (window.confirm('🚨 警告：此操作将清空本地画廊中存储的所有图片！确定要继续吗？')) {
      await localforage.clear();
      window.location.reload();
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const dataStr = exportBackupData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `imagehub_backup_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      console.error(err);
      alert('备份导出失败，请重试');
    }
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importBackupData(content);
      if (success) {
        setImportStatus('success');
        setTimeout(() => {
          setImportStatus('idle');
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 2000);
        alert('导入失败！请确保上传了正确的 ImageHub 备份文件。');
      }
    };
    reader.readAsText(file);
  };

  const themesInfo = [
    { id: 'light' as ColorTheme, name: '极简明亮 (Light Mode)', color: '#ffffff' },
    { id: 'cyberpunk' as ColorTheme, name: '赛博深蓝 (Default Dark)', color: '#06060c' },
    { id: 'amoled' as ColorTheme, name: 'AMOLED 纯黑 (OLED)', color: '#000000' },
    { id: 'aurora' as ColorTheme, name: '极光深紫 (Purple)', color: '#0a0518' }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
        <p className="page-subtitle">配置您的移动端颜色模式、备份恢复与 API 密钥，数据 100% 存储在本地</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Side Form settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Mobile Colors Theme Selector */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette style={{ width: 18, color: 'var(--primary)' }} />
              移动端色彩模式 (OLED 优化)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {themesInfo.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: theme === t.id ? 'var(--primary-glow)' : 'var(--bg-input)',
                    border: `1px solid ${theme === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: t.color, border: '1px solid rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.name}</span>
                  </div>
                  {theme === t.id && <Check style={{ width: 16, color: 'var(--primary)' }} />}
                </div>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '10px', lineHeight: '1.4' }}>
              💡 <b>提示：</b> 推荐在 iPhone (OLED 屏幕) 上开启 <b>AMOLED 纯黑</b> 模式，可以大幅节省屏幕功耗，展现极致对比度。
            </span>
          </div>

          {/* Backup and Restore */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database style={{ width: 18, color: 'var(--primary)' }} />
              本地图库备份与恢复
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              因为数据 100% 存在浏览器本地 IndexedDB 中，当您清除手机 Safari 缓存或更换设备时，图片可能会丢失。建议定期备份图库：
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.85rem', display: 'inline-flex', gap: '6px' }} onClick={handleExportBackup}>
                <Download style={{ width: 16 }} />
                导出数据备份
              </button>

              <input
                type="file"
                accept=".json"
                ref={importFileRef}
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '0.85rem', display: 'inline-flex', gap: '6px', color: importStatus === 'success' ? 'var(--success)' : '' }}
                onClick={() => importFileRef.current?.click()}
              >
                {importStatus === 'success' ? <Check style={{ width: 16 }} /> : <Upload style={{ width: 16 }} />}
                {importStatus === 'success' ? '导入成功' : '导入备份文件'}
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleClearDatabase} style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'inline-flex', gap: '8px' }}>
                <Trash2 style={{ width: 16 }} />
                清空本地画廊数据库
              </button>
            </div>
          </div>
        </div>

        {/* Right Side API Keys */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* API Keys Configuration */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key style={{ width: 18, color: 'var(--primary)' }} />
              API 密钥配置
            </h3>

            {/* Pixabay Key */}
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Pixabay API Key (在线搜图)</label>
              <input
                type="password"
                className="input-field"
                placeholder="填入 Pixabay API Key..."
                value={pixabayKey}
                onChange={(e) => setPixabayKey(e.target.value)}
              />
            </div>

            {/* SiliconFlow Key */}
            <div className="input-group">
              <label className="input-label" style={{ fontSize: '0.75rem' }}>SiliconFlow API Key (高速生图)</label>
              <input
                type="password"
                className="input-field"
                placeholder="填入 SiliconFlow API Key..."
                value={siliconFlowKey}
                onChange={(e) => setSiliconFlowKey(e.target.value)}
              />
            </div>

            {/* DeepSeek Key */}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>DeepSeek API Key (提示词润色)</label>
              <input
                type="password"
                className="input-field"
                placeholder="填入 DeepSeek API Key..."
                value={deepSeekKey}
                onChange={(e) => setDeepSeekKey(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Install Guide */}
          <div className="glass-panel" style={{ margin: 0, padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone style={{ width: 18, color: 'var(--primary)' }} />
              iPhone 安装独立 App 说明
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
              <p>1. 用 iPhone 上的 <b>Safari 浏览器</b> 打开部署好的网页。</p>
              <p>2. 点击 Safari 底部底栏的 <b>“分享”</b> 按钮（带箭头的方框）。</p>
              <p>3. 向下滚动并选择 <b>“添加到主屏幕” (Add to Home Screen)</b> 并确认。</p>
              <p>4. 随后即可在手机桌面像点击原生 App 一样直接打开使用，支持无网离线运行。</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
