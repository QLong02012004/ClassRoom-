import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/tts?text=...
 * Dịch vụ đọc điểm số / văn bản bằng giọng tiếng Việt chuẩn, tự nhiên
 */
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const text = (req.query.text as string) || '';
    if (!text.trim()) {
      return res.status(400).json({ message: 'Text query parameter is required' });
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text.trim())}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to fetch TTS from upstream' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('[TTS Error]:', error);
    return res.status(500).json({ message: 'Lỗi phát âm giọng đọc tiếng Việt' });
  }
});

export default router;
