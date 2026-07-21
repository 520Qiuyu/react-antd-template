import { SodaAudioDecryptor } from '@/utils/sodaDecryptor';
import { msgError, msgSuccess } from '@/utils/modal';
import { Button, Input, Space } from 'antd';
import { useState } from 'react';

const { TextArea } = Input;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const guessFilename = (audioUrl: string) => {
  try {
    const pathname = new URL(audioUrl).pathname;
    const last = pathname.split('/').filter(Boolean).pop() || '';
    if (last.includes('.')) return `${last.replace(/\.[^.]+$/, '')}.decrypted.m4a`;
  } catch {
    // ignore
  }
  return 'decrypted.m4a';
};

export default function TestModal() {
  const [audioUrl, setAudioUrl] = useState('');
  const [playAuth, setPlayAuth] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDecrypt = async () => {
    const url = audioUrl.trim();
    if (!url) {
      msgError('请先粘贴音频地址');
      return;
    }
    if (!playAuth.trim()) {
      msgError('请输入 playAuth');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url, {
        referrerPolicy: 'no-referrer',
        mode: 'cors',
      });
      if (!res.ok) {
        msgError(`下载失败：${res.status} ${res.statusText}`);
        return;
      }
      const fileBlob = await res.blob();
      const { blob, decrypted, reason } = await SodaAudioDecryptor.decryptBlob(
        fileBlob,
        playAuth.trim(),
      );
      if (!decrypted) {
        msgError(reason || '解密失败');
        return;
      }
      downloadBlob(blob, guessFilename(url));
      msgSuccess('解密成功，已开始下载');
    } catch (error) {
      console.error(error);
      msgError('下载或解密过程出错（可能是 CORS）');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, padding: 24 }}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>音频地址</div>
          <TextArea
            rows={4}
            placeholder='粘贴 main_url / MainPlayUrl…'
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>playAuth / spade_a</div>
          <TextArea
            rows={4}
            placeholder='粘贴 playAuth 或 spade_a…'
            value={playAuth}
            onChange={(e) => setPlayAuth(e.target.value)}
          />
        </div>

        <Button type='primary' loading={loading} onClick={handleDecrypt} block>
          解密并下载
        </Button>
      </Space>
    </div>
  );
}
