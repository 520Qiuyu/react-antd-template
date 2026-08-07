import {
  useEmbedAudioMetadata,
  type EmbedOutputFormat,
} from '@/hooks/useEmbedAudioMetadata';
import { downloadBlob } from '@/utils/download';
import { msgError, msgSuccess } from '@/utils/modal';
import { Button, Form, Input, Progress, Select, Space, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useMemo, useState } from 'react';

interface MetadataFormValues {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: string;
  lyric?: string;
  comment?: string;
}

const getFileFromUploadList = (fileList: UploadFile[]) => {
  const file = fileList[0];
  if (!file) return null;
  return (file.originFileObj as File | undefined) || null;
};

const buildOutputFilename = (
  outputFormat: EmbedOutputFormat,
  title?: string,
  artist?: string,
) => {
  const safeTitle = (title || '未知歌曲').replace(/[\\/:*?"<>|]/g, '_').trim();
  const safeArtist = (artist || '未知歌手').replace(/[\\/:*?"<>|]/g, '_').trim();
  return `${safeTitle}-${safeArtist}.${outputFormat}`;
};

export default function TestFfmpeg() {
  const [form] = Form.useForm<MetadataFormValues>();
  const [audioFileList, setAudioFileList] = useState<UploadFile[]>([]);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [outputFormat, setOutputFormat] = useState<EmbedOutputFormat>('mp3');
  const [ffmpegLog, setFfmpegLog] = useState('');
  const [embedding, setEmbedding] = useState(false);
  const [embedProgress, setEmbedProgress] = useState(0);
  const { coreLoading, loaded, loadStage, progress, loadFfmpeg, embedMetadata } =
    useEmbedAudioMetadata({
      onLog: (message, type) => {
        console.log('message', message);
        console.log('type', type);
        setFfmpegLog((prev) => `${prev}\n${message}`.trim());
      },
      onProgress: (percent) => {
        setEmbedProgress(percent);
      },
    });

  const audioFile = useMemo(() => getFileFromUploadList(audioFileList), [audioFileList]);
  const coverFile = useMemo(() => getFileFromUploadList(coverFileList), [coverFileList]);

  const handleLoadFfmpeg = async () => {
    try {
      await loadFfmpeg();
      msgSuccess('FFmpeg 加载成功');
    } catch (error) {
      console.error(error);
      msgError(
        error instanceof Error
          ? `FFmpeg 加载失败：${error.message}`
          : 'FFmpeg 加载失败，请刷新页面后重试',
      );
    }
  };

  const handleGenerate = async () => {
    if (!audioFile) {
      msgError('请先选择音频文件');
      return;
    }

    const values = await form.validateFields();

    setEmbedding(true);
    setEmbedProgress(0);
    try {
      const outputBlob = await embedMetadata({
        audio: audioFile,
        audioName: audioFile.name,
        cover: coverFile,
        coverName: coverFile?.name,
        metadata: values,
        outputFormat,
      });
      const filename = buildOutputFilename(outputFormat, values.title, values.artist);
      downloadBlob(outputBlob, filename);
      msgSuccess('元信息写入成功，已开始下载');
    } catch (error) {
      console.error(error);
      msgError(error instanceof Error ? error.message : '元信息写入失败');
    } finally {
      setEmbedding(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, padding: 24 }}>
      <Space direction='vertical' size={16} style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>1. 选择音频文件</div>
          <Upload
            accept='audio/*,.mp3,.m4a,.aac,.flac,.ogg,.wav'
            maxCount={1}
            fileList={audioFileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setAudioFileList(fileList.slice(-1))}>
            <Button>选择音频</Button>
          </Upload>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>2. 选择输出格式</div>
          <Select
            style={{ width: 200 }}
            value={outputFormat}
            onChange={setOutputFormat}
            options={[
              { label: 'MP3', value: 'mp3' },
              { label: 'M4A', value: 'm4a' },
              { label: 'FLAC', value: 'flac' },
            ]}
          />
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>3. 填写元信息</div>
          <Form form={form} layout='vertical'>
            <Form.Item label='歌名' name='title'>
              <Input placeholder='例如：晴天' />
            </Form.Item>
            <Form.Item label='歌手' name='artist'>
              <Input placeholder='例如：周杰伦' />
            </Form.Item>
            <Form.Item label='专辑' name='album'>
              <Input placeholder='例如：叶惠美' />
            </Form.Item>
            <Form.Item label='专辑艺术家' name='albumArtist'>
              <Input placeholder='可选' />
            </Form.Item>
            <Form.Item label='流派' name='genre'>
              <Input placeholder='例如：Pop' />
            </Form.Item>
            <Form.Item label='年份' name='year'>
              <Input placeholder='例如：2003' />
            </Form.Item>
            <Form.Item label='备注' name='comment'>
              <Input placeholder='可选' />
            </Form.Item>
          </Form>
        </div>

        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>4. 选择专辑封面（可选）</div>
          <Upload
            accept='image/*,.jpg,.jpeg,.png,.webp'
            maxCount={1}
            listType='picture-card'
            fileList={coverFileList}
            beforeUpload={() => false}
            onChange={({ fileList }) => setCoverFileList(fileList.slice(-1))}>
            {coverFileList.length >= 1 ? null : <div>上传封面</div>}
          </Upload>
        </div>

        <Space direction='vertical' size={8} style={{ width: '100%' }}>
          <Button onClick={handleLoadFfmpeg} loading={coreLoading} block>
            {loaded ? 'FFmpeg 已就绪' : '预加载 FFmpeg'}
          </Button>
          <div style={{ fontSize: 12, color: '#666' }}>状态：{loadStage}</div>
          {coreLoading ? <Progress percent={progress} status='active' /> : null}
          {embedding ? <Progress percent={embedProgress} status='active' /> : null}
          <Button type='primary' loading={embedding} onClick={handleGenerate} block>
            生成并下载嵌入元信息后的文件
          </Button>
          {ffmpegLog ? (
            <pre
              style={{
                margin: 0,
                padding: 12,
                maxHeight: 160,
                overflow: 'auto',
                background: '#f5f5f5',
                borderRadius: 8,
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
              {ffmpegLog}
            </pre>
          ) : null}
        </Space>
      </Space>
    </div>
  );
}
