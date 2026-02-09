/**
 * Canvas 辅助工具函数
 * 处理资产到画布元素的转换
 */

import { GeneratedAsset } from '../types/agent.types';
import { CanvasElement } from '../types';

/**
 * 将单个GeneratedAsset转换为CanvasElement
 */
export function assetToCanvasElement(
  asset: GeneratedAsset,
  options: {
    x?: number;
    y?: number;
    zIndex?: number;
  } = {}
): CanvasElement {
  const baseElement = {
    id: asset.id,
    x: options.x || 100,
    y: options.y || 100,
    zIndex: options.zIndex || 1
  };

  if (asset.type === 'image') {
    return {
      ...baseElement,
      type: 'gen-image',
      url: asset.url,
      width: 512,
      height: 512,
      genPrompt: asset.metadata.prompt,
      genModel: asset.metadata.model as any,
      genAspectRatio: '1:1',
      genResolution: '2K'
    } as CanvasElement;
  }

  if (asset.type === 'video') {
    return {
      ...baseElement,
      type: 'gen-video',
      url: asset.url,
      width: 640,
      height: 360,
      genPrompt: asset.metadata.prompt,
      genModel: asset.metadata.model as any,
      genAspectRatio: '16:9',
      genDuration: '5s'
    } as CanvasElement;
  }

  throw new Error(`Unknown asset type: ${asset.type}`);
}

/**
 * 将多个GeneratedAssets转换为CanvasElements
 * 自动错开位置避免重叠
 */
export function assetsToCanvasElements(
  assets: GeneratedAsset[],
  startPosition: { x: number; y: number } = { x: 100, y: 100 },
  startZIndex: number = 1
): CanvasElement[] {
  return assets.map((asset, index) => {
    return assetToCanvasElement(asset, {
      x: startPosition.x + (index * 50),
      y: startPosition.y + (index * 50),
      zIndex: startZIndex + index
    });
  });
}

/**
 * 计算画布中心位置（用于居中放置新元素）
 */
export function getCanvasCenter(
  canvasWidth: number,
  canvasHeight: number,
  pan: { x: number; y: number },
  zoom: number
): { x: number; y: number } {
  const centerX = (canvasWidth / 2 - pan.x) / (zoom / 100);
  const centerY = (canvasHeight / 2 - pan.y) / (zoom / 100);
  return { x: centerX, y: centerY };
}

/**
 * 在画布中心放置资产
 */
export function assetsToCanvasElementsAtCenter(
  assets: GeneratedAsset[],
  canvasWidth: number,
  canvasHeight: number,
  pan: { x: number; y: number },
  zoom: number,
  startZIndex: number = 1
): CanvasElement[] {
  const center = getCanvasCenter(canvasWidth, canvasHeight, pan, zoom);
  
  return assets.map((asset, index) => {
    // 根据资产数量计算网格布局
    const cols = Math.ceil(Math.sqrt(assets.length));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    const spacing = 550; // 元素间距
    const offsetX = (col - (cols - 1) / 2) * spacing;
    const offsetY = (row - (Math.ceil(assets.length / cols) - 1) / 2) * spacing;
    
    return assetToCanvasElement(asset, {
      x: center.x + offsetX - 256, // 256 = width/2
      y: center.y + offsetY - 256,
      zIndex: startZIndex + index
    });
  });
}
