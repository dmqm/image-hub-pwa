import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, BrainCircuit, RefreshCw, Send, Check, Heart, ArrowRight } from 'lucide-react';

export const AIGenerator: React.FC = () => {
  const { siliconFlowKey, deepSeekKey, addToGallery, importToStudio } = useApp();
  
  const [prompt, setPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedEngine, setSelectedEngine] = useState<'pollinations' | 'siliconflow'>('pollinations');
  
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preset Styles to append
  const stylesList = [
    { name: '真实感摄影', suffix: 'photorealistic, 8k resolution, highly detailed, professional photography, studio lighting' },
    { name: '赛博朋克', suffix: 'cyberpunk style, neon lights, glowing signs, futuristic, dark environment, highly detailed' },
    { name: '新海诚动漫', suffix: 'anime style by Makoto Shinkai, beautiful sky, clouds, sun shafts, colorful, detailed illustration' },
    { name: '水彩手绘', suffix: 'beautiful watercolor painting, soft edges, pastel colors, artistic, detailed paper texture' },
    { name: '像素艺术', suffix: 'pixel art style, 16-bit, retro game, highly detailed pixel textures' },
    { name: '3D 渲染', suffix: '3D render, octane render, stylized 3D model, cute, vibrant colors, pastel background' }
  ];

  // Optimize prompt using DeepSeek API
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) {
      setErrorMsg('请输入基础描述后再进行优化！');
      return;
    }
    if (!deepSeekKey) {
      setErrorMsg('未配置 DeepSeek API Key。请在“系统设置”中填写您的 Key，或直接使用普通描述生图。');
      return;
    }

    setOptimizing(true);
    setErrorMsg('');
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepSeekKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a professional Stable Diffusion and Midjourney prompt engineer. Translate the user\'s Chinese idea to a highly detailed, professional, descriptive English prompt for AI image generation. Add keywords about camera lens, dramatic lighting, details, rendering style (e.g. photorealistic, 8k, Unreal Engine 5), and artistic mood. Output ONLY the English prompt. Do NOT include any Chinese, explanation, markdown or conversation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('DeepSeek 接口响应异常，请检查 API Key 或余额。');
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content;
      if (result) {
        setOptimizedPrompt(result.trim());
      } else {
        throw new Error('未返回优化结果');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'DeepSeek 优化失败，请检查网络或配置。');
    } finally {
      setOptimizing(false);
    }
  };

  // Generate Image
  const handleGenerate = async () => {
    const finalPromptText = optimizedPrompt || prompt;
    if (!finalPromptText.trim()) {
      setErrorMsg('请填写提示词描述！');
      return;
    }

    setGenerating(true);
    setGeneratedImgUrl(null);
    setIsSaved(false);
    setErrorMsg('');

    // Append style suffix if selected
    let fullPrompt = finalPromptText;
    if (selectedStyle) {
      fullPrompt = `${fullPrompt}, ${selectedStyle}`;
    }

    try {
      if (selectedEngine === 'siliconflow') {
        if (!siliconFlowKey) {
          throw new Error('未配置硅基流动 (SiliconFlow) API Key，请先前往系统设置填写。');
        }

        // SiliconFlow standard image generation
        const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${siliconFlowKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // Using a highly fast and cost-effective Flux model
            model: 'black-forest-labs/FLUX.1-schnell',
            prompt: fullPrompt,
            image_size: '1024x1024',
            num_inference_steps: 4
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || '硅基流动生成图片失败，请检查您的 API Key 是否正确或账户余额。');
        }

        const data = await response.json();
        const imgUrl = data.data?.[0]?.url;
        if (imgUrl) {
          // Fetch and convert to base64 to bypass canvas CORS issues
          const imgResponse = await fetch(imgUrl);
          const blob = await imgResponse.blob();
          const base64Url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setGeneratedImgUrl(base64Url);
        } else {
          throw new Error('未返回图片 URL');
        }
      } else {
        // Pollinations.ai free engine
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
        
        // Fetch it as blob first to convert to base64, so it can be fully offline, saved in DB, and avoiding CORS issue in Canvas
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('免费生图引擎响应失败，请检查网络或稍后重试。');
        }
        const blob = await response.ok ? await response.blob() : null;
        if (blob) {
          const base64Url = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          setGeneratedImgUrl(base64Url);
        } else {
          throw new Error('无法读取图片数据');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '生图失败，请检查您的国内网络环境或 API Key。');
    } finally {
      setGenerating(false);
    }
  };

  // Save to IndexedDB Gallery
  const handleSaveToGallery = async () => {
    if (!generatedImgUrl) return;
    try {
      // Extract average color from image
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        let color = { r: 128, g: 128, b: 128 };
        if (ctx) {
          ctx.drawImage(img, 0, 0, 16, 16);
          const imgData = ctx.getImageData(0, 0, 16, 16);
          const data = imgData.data;
          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
          color = {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
          };
        }
        await addToGallery(
          generatedImgUrl,
          (prompt || 'AI 生成').slice(0, 15) + '...',
          ['AI生成', selectedEngine],
          color
        );
        setIsSaved(true);
      };
      img.src = generatedImgUrl;
    } catch (err) {
      console.error(err);
      alert('保存失败，请重试');
    }
  };

  const handleImport = () => {
    if (generatedImgUrl) {
      importToStudio(generatedImgUrl);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">AI 生图中心</h1>
        <p className="page-subtitle">使用自然语言生成令人惊叹的图片，国内免翻墙高速响应</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Prompt Section */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>1. 输入创意描述 (中文/英文)</span>
                {deepSeekKey && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                    onClick={handleOptimizePrompt}
                    disabled={optimizing || generating}
                  >
                    {optimizing ? <RefreshCw className="animate-spin" style={{ width: 12, marginRight: 4 }} /> : <BrainCircuit style={{ width: 12, marginRight: 4 }} />}
                    DeepSeek 润色提示词
                  </button>
                )}
              </label>
              <textarea
                className="input-field"
                style={{ height: '100px', resize: 'none', lineHeight: '1.5' }}
                placeholder="例如：赛博朋克风的街道，下着雨，霓虹灯倒影在水洼里..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={generating || optimizing}
              />
            </div>

            {/* Optimized prompt box */}
            {optimizedPrompt && (
              <div className="input-group animate-fade-in" style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed var(--primary)', padding: '10px 15px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <span className="input-label" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>DeepSeek 润色后的英文提示词：</span>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.4', margin: '5px 0' }}>{optimizedPrompt}</p>
                <span
                  style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-end' }}
                  onClick={() => setOptimizedPrompt('')}
                >
                  清除优化，回退为普通描述
                </span>
              </div>
            )}

            {/* Styles Selector */}
            <div className="input-group">
              <label className="input-label">2. 选择艺术风格</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {stylesList.map((style, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedStyle(selectedStyle === style.suffix ? '' : style.suffix)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedStyle === style.suffix ? 'var(--primary-glow)' : 'var(--bg-input)',
                      border: `1px solid ${selectedStyle === style.suffix ? 'var(--primary)' : 'var(--border-color)'}`,
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                    }}
                  >
                    {style.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engine & Run Section */}
          <div className="glass-panel" style={{ margin: 0, padding: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label className="input-label">3. 选择生图引擎</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={`btn ${selectedEngine === 'pollinations' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setSelectedEngine('pollinations')}
                >
                  免费免 Key 引擎 (Pollinations)
                </button>
                <button
                  className={`btn ${selectedEngine === 'siliconflow' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: '1', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => setSelectedEngine('siliconflow')}
                >
                  国内极速 Flux 引擎 (硅基流动)
                </button>
              </div>
              {selectedEngine === 'siliconflow' && !siliconFlowKey && (
                <span style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '5px' }}>
                  ⚠️ 请确保在“系统设置”中填入您的 SiliconFlow Key 才能使用该引擎。
                </span>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', boxShadow: 'var(--shadow-glow)' }}
              onClick={handleGenerate}
              disabled={generating || optimizing || (!prompt.trim() && !optimizedPrompt.trim())}
            >
              {generating ? (
                <>
                  <RefreshCw className="animate-spin" style={{ width: 20 }} />
                  {selectedEngine === 'siliconflow' ? '硅基算力正在绘制中 (约 2~4 秒)...' : 'AI 正在渲染梦境图片...'}
                </>
              ) : (
                <>
                  <Sparkles style={{ width: 20 }} />
                  生成我的 AI 图片
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output */}
        <div className="glass-panel" style={{ height: '100%', minHeight: '430px', display: 'flex', flexDirection: 'column', margin: 0 }}>
          <div className="input-label" style={{ marginBottom: '1rem' }}>4. 渲染输出结果</div>
          
          <div
            style={{
              flex: '1',
              width: '100%',
              minHeight: '320px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px dashed var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <span>AI 正在勾勒创意细节...</span>
              </div>
            ) : generatedImgUrl ? (
              <img
                src={generatedImgUrl}
                alt="Generated Output"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                <Send style={{ width: 44, height: 44, strokeWidth: 1.25, color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)' }}>等待激发创意</span>
                <span style={{ fontSize: '0.8rem' }}>在左侧输入文字描述并选择参数，即可在此处实时输出高清画作</span>
              </div>
            )}
          </div>

          {generatedImgUrl && !generating && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: '1' }} onClick={handleImport}>
                导入 Studio 剪裁/滤镜
                <ArrowRight style={{ width: 16 }} />
              </button>
              <button
                className={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
                style={{ color: isSaved ? 'var(--success)' : '' }}
                onClick={handleSaveToGallery}
                disabled={isSaved}
              >
                {isSaved ? <Check style={{ width: 16 }} /> : <Heart style={{ width: 16 }} />}
                {isSaved ? '已保存至画廊' : '保存到我的画廊'}
              </button>
              <a
                href={generatedImgUrl}
                download="ai_image.png"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', padding: '0.85rem 1rem' }}
              >
                下载
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="glass-panel animate-fade-in" style={{ borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1.5rem' }}>
          <span>⚠️ {errorMsg}</span>
        </div>
      )}
    </div>
  );
};
