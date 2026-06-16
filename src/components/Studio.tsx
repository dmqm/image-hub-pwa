import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RotateCw, FlipHorizontal, FlipVertical, Undo, Redo, Download, Heart, Check, Trash2, Edit2 } from 'lucide-react';

interface FilterPreset {
  name: string;
  class: string;
  filterString: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: '原图 (Normal)', class: 'normal', filterString: 'none' },
  { name: '怀旧复古 (Vintage)', class: 'vintage', filterString: 'sepia(0.6) contrast(1.1) brightness(0.95)' },
  { name: '赛博朋克 (Cyberpunk)', class: 'cyberpunk', filterString: 'hue-rotate(60deg) saturate(1.8) contrast(1.2)' },
  { name: '黑白胶片 (Grayscale)', class: 'grayscale', filterString: 'grayscale(1) contrast(1.25)' },
  { name: '冷酷冬日 (Cool)', class: 'cool', filterString: 'hue-rotate(190deg) saturate(1.2) brightness(1.05)' },
  { name: '温馨阳光 (Warm)', class: 'warm', filterString: 'sepia(0.35) saturate(1.4) hue-rotate(-10deg)' },
  { name: '反色艺术 (Invert)', class: 'invert', filterString: 'invert(1)' },
  { name: '梦幻朦胧 (Dream)', class: 'dream', filterString: 'blur(3px) saturate(1.2)' }
];

export const Studio: React.FC = () => {
  const { currentImage, setCurrentImage, addToGallery } = useApp();

  // Settings
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);

  // Creative Filters
  const [selectedFilter, setSelectedFilter] = useState<FilterPreset>(FILTER_PRESETS[0]);
  const [pixelate, setPixelate] = useState(false);
  const [pixelSize, setPixelSize] = useState(10);

  // Tools
  const [activeTool, setActiveTool] = useState<'adjust' | 'filter' | 'draw'>('adjust');

  // Pencil Draw Settings
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#6366f1');
  const [brushWidth, setBrushWidth] = useState(8);

  // Undo/Redo Stacks
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup/load image on Canvas
  useEffect(() => {
    if (currentImage) {
      loadImageToCanvas(currentImage, true);
    }
  }, [currentImage]);

  // Redraw when adjustments change
  useEffect(() => {
    if (currentImage) {
      applyFilters();
    }
  }, [brightness, contrast, saturation, blur, hueRotate, selectedFilter, pixelate, pixelSize]);

  // Load Image onto Canvas
  const loadImageToCanvas = (src: string, resetSettings = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (resetSettings) {
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBlur(0);
      setHueRotate(0);
      setSelectedFilter(FILTER_PRESETS[0]);
      setPixelate(false);
      setHistory([]);
      setHistoryIdx(-1);
    }

    const img = new Image();
    img.onload = () => {
      // Scale down large images to prevent browser lag, while maintaining aspect ratio
      const maxDim = 1200;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      if (resetSettings) {
        // Save initial state to history
        const dataUrl = canvas.toDataURL();
        setHistory([dataUrl]);
        setHistoryIdx(0);
      }
    };
    img.src = src;
  };

  // Build filter CSS string
  const getFilterString = () => {
    let cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hueRotate}deg)`;
    if (selectedFilter.filterString !== 'none') {
      cssFilter = `${cssFilter} ${selectedFilter.filterString}`;
    }
    return cssFilter;
  };

  // Redraw original canvas and apply adjustments
  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIdx < 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters directly on context (for high performance canvas rendering)
      if (typeof (ctx as any).filter !== 'undefined') {
        ctx.filter = getFilterString();
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
      } else {
        // Fallback CSS style
        canvas.style.filter = getFilterString();
        (ctx as any).drawImage(img, 0, 0);
      }

      // Draw Pixelation if enabled
      if (pixelate) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width / pixelSize;
        tempCanvas.height = canvas.height / pixelSize;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
        }
      }
      ctx.restore();
    };
    // Draw using the base image from current history step (without temporary filters applied)
    img.src = history[historyIdx];
  };

  // Push new state to history stack (for drawing, rotation, crop)
  const pushHistoryState = (dataUrl: string) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Geometrical Transforms
  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load current display state (with filters baked in) to rotate it
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.height;
      tempCanvas.height = canvas.width;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        tempCtx.rotate(Math.PI / 2);
        tempCtx.drawImage(img, -canvas.width / 2, -canvas.height / 2);
        
        // Overwrite main canvas size
        canvas.width = tempCanvas.width;
        canvas.height = tempCanvas.height;
        ctx.drawImage(tempCanvas, 0, 0);
        
        // Push state
        const rotatedDataUrl = canvas.toDataURL();
        pushHistoryState(rotatedDataUrl);
        
        // Reset temporary sliders since they are now baked into the rotated state
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setBlur(0);
        setHueRotate(0);
        setSelectedFilter(FILTER_PRESETS[0]);
        setPixelate(false);
      }
    };
    img.src = canvas.toDataURL();
  };

  const handleFlip = (direction: 'h' | 'v') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      if (direction === 'h') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      const flippedDataUrl = canvas.toDataURL();
      pushHistoryState(flippedDataUrl);
      
      // Reset temporary sliders
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setBlur(0);
      setHueRotate(0);
      setSelectedFilter(FILTER_PRESETS[0]);
      setPixelate(false);
    };
    img.src = canvas.toDataURL();
  };

  // Drawing Functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Scale coords to actual canvas resolution
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.restore();
    }
    
    // Save drawn state to history
    const dataUrl = canvas.toDataURL();
    pushHistoryState(dataUrl);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm('确定清除画布并回退到初始图片吗？所有画笔和调节将丢失。')) {
      if (history.length > 0) {
        setHistoryIdx(0);
        loadImageToCanvas(history[0], true);
      }
    }
  };

  // Save to Gallery
  const handleSaveToGallery = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Calculate color descriptor
      const ctx = canvas.getContext('2d');
      let color = { r: 128, g: 128, b: 128 };
      if (ctx) {
        const imgData = ctx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2]; count++;
        }
        color = { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
      }

      await addToGallery(dataUrl, `编辑于Studio_${Date.now()}`, ['画廊', '编辑'], color);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `studio_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">图像处理 Studio</h1>
        <p className="page-subtitle">强大的画布引擎，支持基础微调、创意滤镜、自由旋转、涂鸦绘画</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left canvas and global tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main display panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '420px', margin: 0 }}>
            {currentImage ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxHeight: '440px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: activeTool === 'draw' ? 'crosshair' : 'default',
                  overflow: 'hidden'
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '420px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-glass)',
                    background: '#0a0a14',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 1rem' }}>
                <Edit2 style={{ width: 44, height: 44 }} />
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Studio 编辑区为空</h3>
                  <p style={{ fontSize: '0.85rem' }}>您可以上传一张本地图片，或从“搜图中心”、“AI生图”将图片导入此处编辑</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                  上传本地图片
                </button>
              </div>
            )}

            {/* Quick action buttons below canvas */}
            {currentImage && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <button className="btn btn-secondary" onClick={handleUndo} disabled={historyIdx <= 0} title="撤销">
                  <Undo style={{ width: 16 }} />
                </button>
                <button className="btn btn-secondary" onClick={handleRedo} disabled={historyIdx >= history.length - 1} title="重做">
                  <Redo style={{ width: 16 }} />
                </button>
                
                <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
                
                <button className="btn btn-secondary" onClick={handleRotate} title="旋转 90 度">
                  <RotateCw style={{ width: 16 }} />
                </button>
                <button className="btn btn-secondary" onClick={() => handleFlip('h')} title="水平翻转">
                  <FlipHorizontal style={{ width: 16 }} />
                </button>
                <button className="btn btn-secondary" onClick={() => handleFlip('v')} title="垂直翻转">
                  <FlipVertical style={{ width: 16 }} />
                </button>

                <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 8px' }} />
                
                <button className="btn btn-secondary" onClick={handleClearCanvas} style={{ color: 'var(--danger)' }} title="清空全部更改">
                  <Trash2 style={{ width: 16 }} />
                </button>

                <div style={{ flex: 1 }} />

                <button className="btn btn-secondary" onClick={handleDownload}>
                  <Download style={{ width: 16 }} />
                  导出
                </button>
                <button
                  className={`btn ${saveSuccess ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ color: saveSuccess ? 'var(--success)' : '' }}
                  onClick={handleSaveToGallery}
                  disabled={loading}
                >
                  {saveSuccess ? <Check style={{ width: 16 }} /> : <Heart style={{ width: 16 }} />}
                  {saveSuccess ? '已收藏' : '收藏'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Settings panel */}
        <div className="glass-panel" style={{ height: '100%', margin: 0, minHeight: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Sub tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '4px', border: '1px solid var(--border-color)' }}>
            <button
              className={`btn ${activeTool === 'adjust' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '6px 0', fontSize: '0.8rem', borderRadius: '10px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('adjust')}
            >
              基础调节
            </button>
            <button
              className={`btn ${activeTool === 'filter' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '6px 0', fontSize: '0.8rem', borderRadius: '10px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('filter')}
            >
              艺术滤镜
            </button>
            <button
              className={`btn ${activeTool === 'draw' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '6px 0', fontSize: '0.8rem', borderRadius: '10px', boxShadow: 'none', border: 'none' }}
              onClick={() => setActiveTool('draw')}
            >
              涂鸦绘画
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {/* 1. Adjustment panel */}
            {activeTool === 'adjust' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>亮度 (Brightness)</span>
                    <span>{brightness}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>对比度 (Contrast)</span>
                    <span>{contrast}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>饱和度 (Saturation)</span>
                    <span>{saturation}%</span>
                  </label>
                  <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>模糊 (Blur)</span>
                    <span>{blur}px</span>
                  </label>
                  <input type="range" min="0" max="20" step="0.5" value={blur} onChange={(e) => setBlur(parseFloat(e.target.value))} style={{ accentColor: 'var(--primary)' }} disabled={!currentImage} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>色相旋转 (Hue Rotate)</span>
                    <span>{hueRotate}°</span>
                  </label>
                  <input type="range" min="0" max="360" value={hueRotate} onChange={(e) => setHueRotate(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} disabled={!currentImage} />
                </div>
              </div>
            )}

            {/* 2. Filter panel */}
            {activeTool === 'filter' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {FILTER_PRESETS.map((filter) => (
                    <div
                      key={filter.name}
                      onClick={() => currentImage && setSelectedFilter(filter)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: selectedFilter.name === filter.name ? 'var(--primary-glow)' : 'var(--bg-input)',
                        border: `1px solid ${selectedFilter.name === filter.name ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: currentImage ? 'pointer' : 'not-allowed',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        opacity: currentImage ? 1 : 0.5,
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {filter.name}
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      id="chk-pixelate"
                      checked={pixelate}
                      onChange={(e) => currentImage && setPixelate(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      disabled={!currentImage}
                    />
                    <label htmlFor="chk-pixelate" className="input-label" style={{ cursor: 'pointer', margin: 0 }}>启用像素画滤镜 (Pixelate)</label>
                  </div>
                  {pixelate && (
                    <div className="input-group animate-fade-in" style={{ margin: 0 }}>
                      <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>像素块尺寸 (Pixel Size)</span>
                        <span>{pixelSize}px</span>
                      </label>
                      <input type="range" min="4" max="30" step="1" value={pixelSize} onChange={(e) => setPixelSize(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Drawing panel */}
            {activeTool === 'draw' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">画笔颜色 (Brush Color)</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {['#6366f1', '#a855f7', '#14b8a6', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#000000'].map((color) => (
                      <div
                        key={color}
                        onClick={() => setBrushColor(color)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                          border: brushColor === color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          transform: brushColor === color ? 'scale(1.15)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    className="input-field"
                    style={{ padding: '2px', height: '36px', width: '100%', cursor: 'pointer' }}
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                  />
                </div>

                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>画笔粗细 (Brush Width)</span>
                    <span>{brushWidth}px</span>
                  </label>
                  <input type="range" min="1" max="50" step="1" value={brushWidth} onChange={(e) => setBrushWidth(parseInt(e.target.value))} style={{ accentColor: 'var(--primary)' }} />
                </div>

                <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', padding: '10px 15px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                  ✏️ <b>使用说明：</b> 激活此标签后，用鼠标或手指直接在左侧画布上拖动即可开始手绘涂鸦。涂鸦记录会实时加入历史栈中，可以使用撤销按钮回滚。
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
