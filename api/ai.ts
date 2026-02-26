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
  theme?: string;
  requirements?: string;
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
  console.log('[AI] streamInlineEdit started, controller created');

  (async () => {
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
        console.error('[AI] HTTP error:', res.status);
        onError(`HTTP ${res.status}`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        console.error('[AI] No readable stream');
        onError('No readable stream');
        return;
      }

      const abortHandler = () => {
        console.log('[AI] Abort signal received, canceling reader');
        reader.cancel('User aborted').catch(() => {});
      };
      controller.signal.addEventListener('abort', abortHandler);

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;

      while (true) {
        if (controller.signal.aborted) {
          console.log('[AI] Loop detected abort signal, breaking');
          break;
        }
        const { done, value } = await reader.read();
        if (controller.signal.aborted) {
          console.log('[AI] Read completed but aborted, breaking');
          break;
        }
        if (done) {
          console.log('[AI] Stream done');
          break;
        }
        chunkCount++;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          if (data === '[DONE]') {
            console.log('[AI] Received [DONE]');
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('[AI] Error in chunk:', parsed.error);
              onError(parsed.error);
              return;
            }
            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      controller.signal.removeEventListener('abort', abortHandler);
      console.log('[AI] Stream completed normally');
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[AI] AbortError caught, stream canceled');
      } else {
        console.error('[AI] Stream error:', err);
        onError(err.message || 'Stream failed');
      }
    }
    console.log('[AI] streamInlineEdit ended');
  })();

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
  console.log('[AI] streamGenerateOutline started, controller created');

  (async () => {
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

      if (!res.ok) {
        console.error('[AI] HTTP error:', res.status);
        onError(`HTTP ${res.status}`);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        console.error('[AI] No readable stream');
        onError('No readable stream');
        return;
      }

      const abortHandler = () => {
        console.log('[AI] Abort signal received, canceling reader');
        reader.cancel('User aborted').catch(() => {});
      };
      controller.signal.addEventListener('abort', abortHandler);

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      while (true) {
        if (controller.signal.aborted) {
          console.log('[AI] Loop detected abort signal, breaking');
          break;
        }
        const { done, value } = await reader.read();
        if (controller.signal.aborted) {
          console.log('[AI] Read completed but aborted, breaking');
          break;
        }
        if (done) {
          console.log('[AI] Stream done');
          break;
        }
        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            console.log('[AI] Received [DONE]');
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('[AI] Error in chunk:', parsed.error);
              onError(parsed.error);
              return;
            }
            if (parsed.content) onChunk(parsed.content);
          } catch { /* skip */ }
        }
      }
      controller.signal.removeEventListener('abort', abortHandler);
      console.log('[AI] Stream completed normally');
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[AI] AbortError caught, stream canceled');
      } else {
        console.error('[AI] Stream error:', err);
        onError(err.message || 'Stream failed');
      }
    }
    console.log('[AI] streamGenerateOutline ended');
  })();

  return controller;
}

// SSE 流式调用 Chat 接口
export async function streamChat(
  message: string,
  history: { role: 'user' | 'ai'; text: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
): Promise<AbortController> {
  const controller = new AbortController();
  const token = localStorage.getItem('token');
  console.log('[AI] streamChat started, controller created');

  // 立即开始异步处理，不阻塞返回 controller
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/ai-assist/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.error('[AI] HTTP error:', res.status);
        onError(`HTTP ${res.status}`);
        return;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        console.error('[AI] No readable stream');
        onError('No readable stream');
        return;
      }

      // 监听 abort 信号，主动取消 reader
      const abortHandler = () => {
        console.log('[AI] Abort signal received, canceling reader');
        reader.cancel('User aborted').catch(() => {});
      };
      controller.signal.addEventListener('abort', abortHandler);

      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;
      while (true) {
        if (controller.signal.aborted) {
          console.log('[AI] Loop detected abort signal, breaking');
          break;
        }
        const { done, value } = await reader.read();
        if (controller.signal.aborted) {
          console.log('[AI] Read completed but aborted, breaking');
          break;
        }
        if (done) {
          console.log('[AI] Stream done');
          break;
        }
        chunkCount++;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            console.log('[AI] Received [DONE]');
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              console.error('[AI] Error in chunk:', parsed.error);
              onError(parsed.error);
              return;
            }
            if (parsed.content) onChunk(parsed.content);
          } catch { /* skip */ }
        }
      }
      controller.signal.removeEventListener('abort', abortHandler);
      console.log('[AI] Stream completed normally');
      onDone();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[AI] AbortError caught, stream canceled');
      } else {
        console.error('[AI] Stream error:', err);
        onError(err.message || 'Stream failed');
      }
    }
    console.log('[AI] streamChat ended');
  })();

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
