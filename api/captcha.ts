import api from './index';

export interface CaptchaData {
  id: string;
  type: 'math' | 'text';
  question: string;
}

export const captchaApi = {
  // 生成验证码
  generate: async (): Promise<CaptchaData> => {
    const response = await api.get('/captcha/generate');
    return response.data;
  },

  // 验证验证码
  verify: async (captchaId: string, captchaAnswer: string): Promise<{ valid: boolean }> => {
    const response = await api.post('/captcha/verify', { captchaId, captchaAnswer });
    return response.data;
  },
};
