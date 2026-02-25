const API_BASE = 'http://localhost:9090/api/v1';

export interface InlineEditParams {
  selectedText: string;
  instruction: string;
  fullContent: string;
  cursorLine?: number;
}

export interface GenerateOutlineParams {
  topic: string;
  slideCount?: number;
  fullContent?: string;
}

export interface SuggestAltParams {
  imageUrl: string;
  surroundingText: string;
}

export interface GenerateImageParams {
  prompt: string;
  size?: string;
}

// SSE 流式调用内联编辑接口，逐 chunk 回调
export async function streamInlineEdit(
  params: InlineEditParams,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<AbortController> {
  const controller = new AbortController();
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/ai-assist/inline-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!res.ok) {
      onError(`HTTP ${res.status}`);
      return controller;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError('No readable stream');
      return controller;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);

        if (data === '[DONE]') {
          onDone();
          return controller;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return controller;
          }
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    onDone();
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      onError(err.message || 'Stream failed');
    }
  }

  return controller;
}

// SSE 流式调用大纲生成接口
export async function streamGenerateOutline(
  params: GenerateOutlineParams,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<AbortController> {
  const controller = new AbortController();
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE}/ai-assist/generate-outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!res.ok) { onError(`HTTP ${res.status}`); return controller; }
    const reader = res.body?.getReader();
    if (!reader) { onError('No readable stream'); return controller; }

    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') { onDone(); return controller; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) { onError(parsed.error); return controller; }
          if (parsed.content) onChunk(parsed.content);
        } catch { /* skip */ }
      }
    }
    onDone();
  } catch (err: any) {
    if (err.name !== 'AbortError') onError(err.message || 'Stream failed');
  }
  return controller;
}

// 非流式，获取图片 alt 文本建议
export async function suggestAltText(params: SuggestAltParams): Promise<string> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai-assist/suggest-alt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data?.alt || 'Image';
}

// AI 生图，返回图片 URL
export async function generateImage(params: GenerateImageParams): Promise<string> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/ai-assist/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.data?.url) throw new Error('No image URL returned');
  return json.data.url;
}
