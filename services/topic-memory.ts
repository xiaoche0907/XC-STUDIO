import { openWorkspaceDB, TOPIC_ASSET_STORE, TOPIC_MEMORY_ITEM_STORE, TOPIC_SNAPSHOT_STORE } from './storage';

export type TopicAssetRole =
  | 'product'
  | 'product_anchor'
  | 'model'
  | 'model_anchor_sheet'
  | 'reference'
  | 'result';

export type AssetRef = {
  assetId: string;
  role: TopicAssetRole;
  url?: string;
  createdAt: number;
};

type TopicSnapshot = {
  topicId: string;
  updatedAt: number;
  summaryText: string;
  pinned: {
    constraints: string[];
    decisions: string[];
  };
  clothingStudio?: {
    productImageRefs: AssetRef[];
    productAnchorRef?: AssetRef;
    modelAnchorSheetRef?: AssetRef;
    modelRef?: AssetRef;
    analysis?: {
      anchorDescription: string;
      forbiddenChanges: string[];
      recommendedPoses: string[];
      recommendedStyling: any;
    };
    requirements?: {
      platform: string;
      aspectRatio: string;
      targetLanguage: string;
      clarity: '2K';
      count: number;
      referenceUrl?: string;
      description?: string;
    };
    lastPlan?: any;
  };
};

type TopicMemoryItem = {
  id: string;
  topicId: string;
  type: 'constraint' | 'instruction' | 'analysis' | 'asset_tag' | 'plan' | 'issue';
  text: string;
  tags?: string[];
  refs?: AssetRef[];
  createdAt: number;
};

type TopicAsset = {
  assetId: string;
  topicId: string;
  role: TopicAssetRole;
  mime: string;
  url?: string;
  blob?: Blob;
  width?: number;
  height?: number;
  createdAt: number;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function getSnapshot(topicId: string): Promise<TopicSnapshot | null> {
  const db = await openWorkspaceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TOPIC_SNAPSHOT_STORE, 'readonly');
    const req = tx.objectStore(TOPIC_SNAPSHOT_STORE).get(topicId);
    req.onsuccess = () => resolve((req.result as TopicSnapshot) || null);
    req.onerror = () => reject(req.error);
  });
}

async function putSnapshot(snapshot: TopicSnapshot): Promise<void> {
  const db = await openWorkspaceDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TOPIC_SNAPSHOT_STORE, 'readwrite');
    const req = tx.objectStore(TOPIC_SNAPSHOT_STORE).put(snapshot);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadTopicSnapshot(topicId: string): Promise<TopicSnapshot | null> {
  if (!topicId) return null;
  return getSnapshot(topicId);
}

export async function upsertTopicSnapshot(topicId: string, patch: Partial<TopicSnapshot>): Promise<void> {
  if (!topicId) return;
  const current = await getSnapshot(topicId);
  const next: TopicSnapshot = {
    topicId,
    updatedAt: Date.now(),
    summaryText: patch.summaryText ?? current?.summaryText ?? '',
    pinned: {
      constraints: dedupe([...(current?.pinned?.constraints || []), ...(patch.pinned?.constraints || [])]).slice(0, 60),
      decisions: dedupe([...(current?.pinned?.decisions || []), ...(patch.pinned?.decisions || [])]).slice(0, 60),
    },
    clothingStudio: patch.clothingStudio ?? current?.clothingStudio,
  };
  await putSnapshot(next);
}

export async function addTopicMemoryItem(input: Omit<TopicMemoryItem, 'id' | 'createdAt'>): Promise<void> {
  if (!input.topicId || !input.text?.trim()) return;
  const db = await openWorkspaceDB();
  const normalized = normalizeText(input.text);

  const existing = await new Promise<TopicMemoryItem[]>((resolve, reject) => {
    const tx = db.transaction(TOPIC_MEMORY_ITEM_STORE, 'readonly');
    const idx = tx.objectStore(TOPIC_MEMORY_ITEM_STORE).index('topicId');
    const req = idx.getAll(input.topicId);
    req.onsuccess = () => resolve((req.result as TopicMemoryItem[]) || []);
    req.onerror = () => reject(req.error);
  });

  if (existing.some((x) => x.type === input.type && normalizeText(x.text) === normalized)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TOPIC_MEMORY_ITEM_STORE, 'readwrite');
    const req = tx.objectStore(TOPIC_MEMORY_ITEM_STORE).put({
      ...input,
      id: makeId('mem'),
      createdAt: Date.now(),
    } as TopicMemoryItem);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveTopicAsset(topicId: string, role: TopicAssetRole, data: { url?: string; blob?: Blob; mime?: string }): Promise<AssetRef | null> {
  if (!topicId) return null;
  if (!data.url && !data.blob) return null;
  const assetId = makeId('asset');
  const asset: TopicAsset = {
    assetId,
    topicId,
    role,
    mime: data.mime || data.blob?.type || 'application/octet-stream',
    url: data.url,
    blob: data.blob,
    createdAt: Date.now(),
  };

  const db = await openWorkspaceDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(TOPIC_ASSET_STORE, 'readwrite');
    const req = tx.objectStore(TOPIC_ASSET_STORE).put(asset);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  return { assetId, role, url: data.url, createdAt: asset.createdAt };
}

export async function saveTopicAssetFromFile(topicId: string, role: TopicAssetRole, file: File): Promise<AssetRef | null> {
  return saveTopicAsset(topicId, role, { blob: file, mime: file.type || 'application/octet-stream' });
}

export async function syncClothingTopicMemory(topicId: string, patch: Partial<NonNullable<TopicSnapshot['clothingStudio']>>): Promise<void> {
  if (!topicId) return;
  const current = await getSnapshot(topicId);
  const nextClothing = {
    productImageRefs: current?.clothingStudio?.productImageRefs || [],
    ...current?.clothingStudio,
    ...patch,
  };

  await upsertTopicSnapshot(topicId, {
    clothingStudio: nextClothing,
    pinned: {
      constraints: [],
      decisions: [],
    },
  });
}

export function extractConstraintHints(text: string): string[] {
  const t = text || '';
  const list: string[] = [];
  if (/纯白|白底|#ffffff/i.test(t)) list.push('背景必须纯白 #FFFFFF');
  if (/2k/i.test(t)) list.push('清晰度固定 2K');
  if (/禁止|不要改|不能改|forbidden/i.test(t)) list.push('保留既定锚点与禁止变更项');
  if (/比例|aspect|\d+:\d+/i.test(t)) list.push('按用户指定画幅比例生成');
  return dedupe(list);
}

export async function buildTopicPinnedContext(topicId: string): Promise<{ text: string; refs: string[] }> {
  const snapshot = await loadTopicSnapshot(topicId);
  if (!snapshot) return { text: '', refs: [] };

  const constraints = snapshot.pinned?.constraints || [];
  const decisions = snapshot.pinned?.decisions || [];
  const c = snapshot.clothingStudio;
  const refs = [
    c?.productAnchorRef?.url,
    c?.modelAnchorSheetRef?.url,
    ...(c?.productImageRefs || []).map((x) => x.url),
    c?.modelRef?.url,
  ].filter((x): x is string => !!x).slice(0, 8);

  const blocks: string[] = [];
  if (constraints.length) blocks.push(`硬约束:\n- ${constraints.slice(0, 12).join('\n- ')}`);
  if (c?.analysis?.anchorDescription) {
    blocks.push(`产品锚点描述:\n${c.analysis.anchorDescription}`);
  }
  if (c?.analysis?.forbiddenChanges?.length) {
    blocks.push(`禁止变更:\n- ${c.analysis.forbiddenChanges.slice(0, 12).join('\n- ')}`);
  }
  if (c?.requirements) {
    blocks.push(`当前参数: platform=${c.requirements.platform}, ratio=${c.requirements.aspectRatio}, clarity=${c.requirements.clarity}, count=${c.requirements.count}`);
  }
  if (decisions.length) blocks.push(`已确认决策:\n- ${decisions.slice(0, 10).join('\n- ')}`);
  if (refs.length) blocks.push(`关键参考图:\n- ${refs.join('\n- ')}`);

  let text = blocks.join('\n\n');
  if (text.length > 4500) {
    const compactBlocks: string[] = [];
    if (constraints.length) compactBlocks.push(`硬约束:\n- ${constraints.slice(0, 8).join('\n- ')}`);
    if (c?.analysis?.anchorDescription) compactBlocks.push(`产品锚点描述:\n${c.analysis.anchorDescription.slice(0, 800)}`);
    if (c?.analysis?.forbiddenChanges?.length) compactBlocks.push(`禁止变更:\n- ${c.analysis.forbiddenChanges.slice(0, 8).join('\n- ')}`);
    if (c?.requirements) compactBlocks.push(`当前参数: platform=${c.requirements.platform}, ratio=${c.requirements.aspectRatio}, clarity=${c.requirements.clarity}, count=${c.requirements.count}`);
    if (refs.length) compactBlocks.push(`关键参考图:\n- ${refs.slice(0, 2).join('\n- ')}`);
    text = compactBlocks.join('\n\n').slice(0, 4500);
  }
  return { text, refs };
}

export async function deleteTopicMemory(topicId: string): Promise<void> {
  if (!topicId) return;
  const db = await openWorkspaceDB();
  const tx = db.transaction([TOPIC_SNAPSHOT_STORE, TOPIC_MEMORY_ITEM_STORE, TOPIC_ASSET_STORE], 'readwrite');

  tx.objectStore(TOPIC_SNAPSHOT_STORE).delete(topicId);

  await deleteByTopicId(tx.objectStore(TOPIC_MEMORY_ITEM_STORE).index('topicId'), topicId);
  await deleteByTopicId(tx.objectStore(TOPIC_ASSET_STORE).index('topicId'), topicId);
}

function deleteByTopicId(index: IDBIndex, topicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = index.openCursor(IDBKeyRange.only(topicId));
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve();
        return;
      }
      cursor.delete();
      cursor.continue();
    };
    req.onerror = () => reject(req.error);
  });
}

function dedupe(items: string[]): string[] {
  const map = new Map<string, string>();
  for (const item of items) {
    const norm = normalizeText(item);
    if (!norm) continue;
    if (!map.has(norm)) map.set(norm, item.trim());
  }
  return Array.from(map.values());
}

function normalizeText(s: string): string {
  return (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
}
