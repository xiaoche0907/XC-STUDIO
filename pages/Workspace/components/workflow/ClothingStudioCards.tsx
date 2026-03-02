import React, { useMemo, useState } from 'react';
import { Download, PlusCircle, Shirt, UserRound, Sparkles, Play, XCircle, RefreshCw } from 'lucide-react';
import type { WorkflowUiMessage, Requirements, ModelGenOptions } from '../../../../types/workflow.types';
import { useClothingStudioChatStore } from '../../../../stores/clothingStudioChat.store';
import { PLATFORM_OPTIONS, LANGUAGE_OPTIONS, CLARITY_OPTIONS, COUNT_OPTIONS, REQUIREMENT_TEMPLATES, REQUIREMENT_TAGS } from '../../../../constants/clothing-requirements';

interface ClothingStudioCardsProps {
  message: WorkflowUiMessage;
  onSubmitRequirements: (data: Requirements) => void;
  onGenerateModel: (data: ModelGenOptions) => void;
  onPickModelCandidate: (url: string) => void;
  onInsertToCanvas: (url: string, label?: string) => void;
  onRetryFailed: () => void;
}

export const ClothingStudioCards: React.FC<ClothingStudioCardsProps> = ({
  message,
  onSubmitRequirements,
  onGenerateModel,
  onPickModelCandidate,
  onInsertToCanvas,
  onRetryFailed,
}) => {
  const state = useClothingStudioChatStore();
  const [form, setForm] = useState<Requirements>(state.requirements);
  const [modelForm, setModelForm] = useState<ModelGenOptions>(state.modelOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const candidateUrls = useMemo(() => state.modelCandidates.map((c) => c.url), [state.modelCandidates]);

  if (message.type === 'clothingStudio.product') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Shirt size={15} /> 服装棚拍组图</div>
        <p className="mt-1 text-xs text-gray-600">请先上传产品图（{message.productCount}/{message.max}）。最多 6 张。</p>
      </div>
    );
  }

  if (message.type === 'clothingStudio.needModel') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900"><UserRound size={15} /> 缺少模特图</div>
        <p className="mt-1 text-xs text-amber-800">可上传模特图，或点击下方生成 AI 模特图。</p>
        <button
          onClick={() => onGenerateModel(modelForm)}
          className="mt-2 inline-flex items-center gap-1 rounded border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          <Sparkles size={12} /> 生成模特图
        </button>
      </div>
    );
  }

  if (message.type === 'clothingStudio.generateModelForm') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Sparkles size={15} /> AI 生成模特图</div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <select className="rounded border px-2 py-1" value={modelForm.gender || '不限'} onChange={(e) => setModelForm((s) => ({ ...s, gender: e.target.value }))}>
            <option>不限</option><option>女性</option><option>男性</option>
          </select>
          <select className="rounded border px-2 py-1" value={modelForm.ageRange || '18-25岁'} onChange={(e) => setModelForm((s) => ({ ...s, ageRange: e.target.value }))}>
            <option>不限</option><option>0-6岁</option><option>7-12岁</option><option>13-17岁</option><option>18-25岁</option><option>26-35岁</option><option>36-50岁</option><option>50岁+</option>
          </select>
          <select className="rounded border px-2 py-1" value={modelForm.skinTone || '亚洲人'} onChange={(e) => setModelForm((s) => ({ ...s, skinTone: e.target.value }))}>
            <option>不限</option><option>白人</option><option>亚洲人</option><option>黑人</option><option>拉丁裔</option>
          </select>
          <input className="rounded border px-2 py-1" placeholder="张数 1~4" type="number" min={1} max={4} value={modelForm.count || 1} onChange={(e) => setModelForm((s) => ({ ...s, count: Math.max(1, Math.min(4, Number(e.target.value) || 1)) }))} />
          <select className="rounded border px-2 py-1" value={modelForm.pose || '站立正面'} onChange={(e) => setModelForm((s) => ({ ...s, pose: e.target.value }))}>
            <option>站立正面</option><option>站立45°侧身</option><option>走路抓拍</option><option>坐姿</option>
          </select>
          <select className="rounded border px-2 py-1" value={modelForm.expression || '自然微笑'} onChange={(e) => setModelForm((s) => ({ ...s, expression: e.target.value }))}>
            <option>自然微笑</option><option>露齿笑</option><option>冷淡高级脸</option><option>认真无表情</option>
          </select>
          <select className="rounded border px-2 py-1" value={modelForm.hairstyle || '披肩直发'} onChange={(e) => setModelForm((s) => ({ ...s, hairstyle: e.target.value }))}>
            <option>披肩直发</option><option>微卷长发</option><option>高马尾</option><option>短发清爽</option>
          </select>
          <select className="rounded border px-2 py-1" value={modelForm.makeup || '日常淡妆'} onChange={(e) => setModelForm((s) => ({ ...s, makeup: e.target.value }))}>
            <option>日常淡妆</option><option>无妆感</option><option>韩系清透</option><option>欧美立体</option>
          </select>
        </div>
        <textarea className="mt-2 w-full rounded border px-2 py-1 text-xs" rows={2} placeholder="其他需求" value={modelForm.extra || ''} onChange={(e) => setModelForm((s) => ({ ...s, extra: e.target.value }))} />
        <button onClick={() => onGenerateModel(modelForm)} className="mt-2 inline-flex items-center gap-1 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"><Play size={12} /> 生成模特图</button>
      </div>
    );
  }

  if (message.type === 'clothingStudio.modelCandidates') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><UserRound size={15} /> 选择模特图</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(candidateUrls.length ? candidateUrls : message.images.map((i) => i.url)).map((url, i) => (
            <button key={i} onClick={() => onPickModelCandidate(url)} className="overflow-hidden rounded border border-gray-200 bg-gray-50 text-left">
              <img src={url} className="h-28 w-full object-cover" />
              <div className="px-2 py-1 text-[11px] text-gray-700">选为模特图</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (message.type === 'clothingStudio.requirementsForm') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Shirt size={15} /> 组图要求</div>
        {!state.modelImage && (
          <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
            当前未确认模特锚点。建议先上传或生成并选择模特图，以保证人物一致性。
          </div>
        )}
        {state.modelImage && (
          <div className="mt-2 flex items-center gap-2 rounded border border-green-200 bg-green-50 px-2.5 py-2">
            <img src={state.modelImage.url} className="h-8 w-8 rounded object-cover" />
            <div className="text-[11px] text-green-800">已使用模特图作为视觉锚点</div>
          </div>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <select className="rounded border px-2 py-1" value={form.platform} onChange={(e) => setForm((s) => ({ ...s, platform: e.target.value }))}>
            {PLATFORM_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select className="rounded border px-2 py-1" value={form.targetLanguage} onChange={(e) => setForm((s) => ({ ...s, targetLanguage: e.target.value }))}>
            {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <input className="rounded border px-2 py-1" placeholder="比例" value={form.aspectRatio} onChange={(e) => setForm((s) => ({ ...s, aspectRatio: e.target.value }))} />
          <select className="rounded border px-2 py-1" value={form.clarity} onChange={(e) => setForm((s) => ({ ...s, clarity: e.target.value as Requirements['clarity'] }))}>
            {CLARITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded border px-2 py-1" value={form.count} onChange={(e) => setForm((s) => ({ ...s, count: Math.max(1, Math.min(10, Number(e.target.value) || 1)) }))}>
            {COUNT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="rounded border px-2 py-1" value={form.templateId || 'ecom_clean'} onChange={(e) => {
            const tpl = REQUIREMENT_TEMPLATES.find(t => t.id === e.target.value);
            setForm((s) => ({ ...s, templateId: e.target.value, description: tpl?.text || s.description }));
          }}>
            {REQUIREMENT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        <div className="mt-2 space-y-2">
          <div>
            <div className="mb-1 text-[11px] font-medium text-gray-600">风格标签</div>
            <div className="flex flex-wrap gap-1">
              {REQUIREMENT_TAGS.style.map(tag => (
                <button key={tag} onClick={() => setForm((s) => ({ ...s, styleTags: s.styleTags?.includes(tag) ? (s.styleTags || []).filter(t => t !== tag) : [...(s.styleTags || []), tag] }))} className={`rounded-full px-2 py-0.5 text-[11px] border ${form.styleTags?.includes(tag) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>{tag}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-medium text-gray-600">背景/镜头/重点</div>
            <div className="flex flex-wrap gap-1">
              {[...REQUIREMENT_TAGS.background, ...REQUIREMENT_TAGS.camera, ...REQUIREMENT_TAGS.focus].map(tag => (
                <button key={tag} onClick={() => setForm((s) => ({ ...s, focusTags: s.focusTags?.includes(tag) ? (s.focusTags || []).filter(t => t !== tag) : [...(s.focusTags || []), tag] }))} className={`rounded-full px-2 py-0.5 text-[11px] border ${form.focusTags?.includes(tag) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300'}`}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        <textarea className="mt-2 w-full rounded border px-2 py-1 text-xs" rows={3} placeholder="组图要求（模板会自动填充，可手动修改）" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />

        <button onClick={() => setShowAdvanced(v => !v)} className="mt-1 text-[11px] text-gray-500 underline">高级：自定义补充（可选）</button>
        {showAdvanced && (
          <textarea className="mt-1 w-full rounded border px-2 py-1 text-xs" rows={2} placeholder="补充说明（可选）" value={form.extraText || ''} onChange={(e) => setForm((s) => ({ ...s, extraText: e.target.value }))} />
        )}

        <button onClick={() => onSubmitRequirements({ ...form, count: Math.max(1, Math.min(10, form.count || 1)) })} className="mt-2 inline-flex items-center gap-1 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white"><Play size={12} /> 开始生成</button>
      </div>
    );
  }

  if (message.type === 'clothingStudio.progress') {
    const pct = message.total > 0 ? Math.round((message.done / message.total) * 100) : 0;
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
        <div className="text-sm font-semibold text-blue-900">正在生成组图 {message.done}/{message.total}</div>
        <div className="mt-2 h-2 w-full rounded bg-blue-100"><div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} /></div>
        <div className="mt-1 text-xs text-blue-800">{message.text || '处理中...'}</div>
        <div className="mt-2 flex gap-2">
          <button onClick={() => state.actions.cancelGenerating()} className="inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs text-blue-700"><XCircle size={12} /> 取消</button>
          <button onClick={onRetryFailed} className="inline-flex items-center gap-1 rounded border border-blue-300 bg-white px-2 py-1 text-xs text-blue-700"><RefreshCw size={12} /> 重试失败项</button>
        </div>
      </div>
    );
  }

  if (message.type === 'clothingStudio.results') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900"><PlusCircle size={15} /> 生成结果</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {message.images.map((img, idx) => (
            <div key={idx} className="overflow-hidden rounded border border-gray-200 bg-gray-50">
              <img src={img.url} className="h-28 w-full object-cover" />
              <div className="flex items-center justify-between px-2 py-1">
                <button onClick={() => onInsertToCanvas(img.url, img.label)} className="text-[11px] text-gray-700">插入画布</button>
                <a href={img.url} download={`clothing-${Date.now()}-${idx + 1}.png`} className="inline-flex items-center gap-1 text-[11px] text-gray-700"><Download size={11} />下载</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
