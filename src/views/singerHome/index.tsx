import {
  getAlbumCover,
  getAlbumInfo,
  getLyric,
  getMusicPlay,
  getSingerAlbum,
  getSingerAvatar,
  getSingerDesc,
  getSingerHotsong,
  getSingerStarNum,
} from '@/apis/qqMusic/singer';
import { useGetData, useSearchParams } from '@/hooks';
import type { AlbumInfo, SongInfo } from '@/types/qqMusic/singer';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  InputNumber,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';
import SongItem from './components/SongItem';
import { NOOP } from '@/constants';
import { msgSuccess } from '@/utils/modal';
import { downloadAsJson, downloadWithFileName } from '@/utils/download';

const { Title, Paragraph, Text } = Typography;

type TabsItemType = {
  key: string;
  label: string;
  children: React.ReactNode;
  closable?: boolean;
};

type SearchParams = {
  activeKey: string;
  currentAlbum?: AlbumInfo;
};

const defaultSearchParams: SearchParams = {
  activeKey: 'desc',
};

export default function SingerHome() {
  const { mid = '' } = useParams();
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  // 歌手描述
  const { data: descData, loading: descLoading } = useGetData(getSingerDesc, {
    singermid: mid,
  });

  // 歌手热门歌曲
  const { data: songData, loading: songLoading } = useGetData(getSingerHotsong, {
    singermid: mid,
    limit: 100,
  });

  // 歌手被关注数量
  const { data: starData, loading: starLoading } = useGetData(getSingerStarNum, {
    singermid: mid,
  });

  // 歌手专辑
  const { data: albumData, loading: albumLoading } = useGetData(getSingerAlbum, {
    singermid: mid,
  });

  // 专辑信息
  const { data: albumInfoData, loading: albumInfoLoading } = useGetData(
    getAlbumInfo,
    {
      albummid: searchParams.currentAlbum?.albumMid || '',
    },
    {
      returnFunction: () => !searchParams.currentAlbum,
      monitors: [searchParams.currentAlbum],
    },
  );

  // 解析 XML 数据
  const singerInfo = useMemo(() => {
    if (!descData) return null;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(descData, 'text/xml');

    const getTextContent = (element: Element | null) =>
      element?.textContent?.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') || '';

    const basicItems = Array.from(xmlDoc.querySelectorAll('basic item')).map((item) => ({
      key: getTextContent(item.querySelector('key')),
      value: getTextContent(item.querySelector('value')),
    }));

    const otherItems = Array.from(xmlDoc.querySelectorAll('other item')).map((item) => ({
      key: getTextContent(item.querySelector('key')),
      value: getTextContent(item.querySelector('value')),
    }));

    return {
      desc: getTextContent(xmlDoc.querySelector('desc')),
      basic: basicItems,
      other: otherItems,
    };
  }, [descData]);

  const loading = !descData || !songData || !starData || albumLoading;
  const songList = songData?.singer?.data?.songlist || [];
  const albumList = albumData?.albumList || [];

  const renderHotSongs = () => {
    if (songLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!songList.length) return <Empty description='暂无热门歌曲' />;
    return (
      <div className={styles['hot-songs']}>
        {songList.map((song, index) => (
          <SongItem key={song.mid} song={song} index={index} />
        ))}
      </div>
    );
  };

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const handleAlbumClick = (album: AlbumInfo) => {
    if (isSelectMode) {
      const hasSelected = selectedAlbums.includes(album.albumMid);
      if (hasSelected) {
        setSelectedAlbums((prev) => prev.filter((mid) => mid !== album.albumMid));
      } else {
        setSelectedAlbums((prev) => [...prev, album.albumMid]);
      }
      return;
    }
    setSearchParams({
      ...searchParams,
      currentAlbum: album,
      activeKey: `album-${album.albumMid}`,
    });
  };
  const [downloading, setDownloading] = useState(false);
  const handleDownloadSelectedAlbums = async () => {
    try {
      setDownloading(true);
      const promises = selectedAlbums.map(async (albumMid) => {
        const res = await getAlbumInfo({ albummid: albumMid });
        const songs = res.response?.data?.list || [];
        return songs;
      });
      const results = await Promise.all(promises);
      msgSuccess('专辑歌曲获取成功！');
      console.log('results', results);
      const URLData: AlbumDownLoadData[] = [];
      for (const result of results) {
        
        const songMidMap = Object.fromEntries(result.map((item) => [item.songmid, item]));
        const songMids = result.map((item) => item.songmid);
        const songRes: any = await getMusicPlay({ songmid: songMids.join(',') });
        const URLMap = songRes?.data?.playUrl;
        const newData: AlbumDownLoadData = {
          albumName: result[0].albumname,
          ablumCover: getAlbumCover(result[0].albummid),
          list: [],
        };
        URLData.push(newData);
        for (const songMid in URLMap) {
          const url = URLMap[songMid];
          const songName = songMidMap[songMid].songname;
          const lrcUrlRes = await getLyric({ songmid: songMid });
          if (!url.error) {
            newData.list.push({
              songName,
              url: url.url,
              lrcContent: lrcUrlRes.response?.lyric,
            });
          }
        }

        // 打印当前专辑信息
        console.log('当前处理专辑', result[0].albumname, newData);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      downloadAsJson(URLData, 'URLData');
    } catch (error) {
      console.log('error', error);
    } finally {
      setDownloading(false);
    }
  };
  const [albumRange, setAlbumRange] = useState<[number, number]>([1, 1]);
  const handleAlbumRangeSelect = () => {
    const [start, end] = albumRange;
    setSelectedAlbums(albumList.slice(start - 1, end).map((item) => item.albumMid));
  };
  const renderAlbums = () => {
    if (albumLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!albumList.length) return <Empty description='暂无专辑' />;
    console.log('albumList', albumList);
    return (
      <div className={styles['albums-container']}>
        <div className={styles['btn-box']}>
          {isSelectMode}
          {isSelectMode ? (
            <>
              {/* 区间选择 */}
              <Space>
                <InputNumber
                  min={1}
                  max={albumList.length}
                  value={albumRange[0]}
                  onChange={(value) => value && setAlbumRange([value, albumRange[1]])}
                />
                <span>~</span>
                <InputNumber
                  min={1}
                  max={albumList.length}
                  value={albumRange[1]}
                  onChange={(value) => value && setAlbumRange([albumRange[0], value])}
                />
                <Button type='primary' onClick={handleAlbumRangeSelect}>
                  区间选择
                </Button>
              </Space>
              {/* 全部选择 */}
              <Button
                type='primary'
                onClick={() => setSelectedAlbums(albumList.map((item) => item.albumMid))}>
                全选
              </Button>
              {/* 下载所选专辑的歌曲 */}
              <Button
                type='primary'
                color='green'
                disabled={!selectedAlbums.length}
                onClick={handleDownloadSelectedAlbums}
                loading={downloading}>
                下载所选专辑的歌曲
              </Button>
              {/* 退出选择 */}
              <Button type='default' onClick={() => setIsSelectMode(false)}>
                退出选择
              </Button>
            </>
          ) : (
            <Button type='primary' onClick={() => setIsSelectMode(true)}>
              批量选择
            </Button>
          )}
        </div>
        <div className={styles['albums-grid']}>
          {albumList.map((item: AlbumInfo, index) => (
            <Card
              key={item.albumMid}
              hoverable
              onClick={() => handleAlbumClick(item)}
              styles={{
                cover: {
                  overflow: 'hidden',
                },
              }}
              cover={
                <>
                  {isSelectMode && (
                    <Checkbox
                      checked={selectedAlbums.includes(item.albumMid)}
                      className={styles['album-checkbox']}
                    />
                  )}
                  {/* 索引 */}
                  <div className={styles['album-index']}>{index + 1}</div>
                  <img
                    className={styles['album-cover']}
                    alt={item.albumName}
                    src={getAlbumCover(item.albumMid)}
                  />
                </>
              }
              className={styles['album-card']}>
              <Card.Meta
                title={item.albumName}
                description={
                  <div className={styles['album-meta']}>
                    <Text type='secondary'>{item.publishDate}</Text>
                    <Text type='secondary'>{item.totalNum}首</Text>
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderBasicInfo = () => {
    if (descLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!singerInfo?.basic.length) return <Empty description='暂无基本信息' />;
    return (
      <Descriptions column={2} bordered>
        {singerInfo.basic.map((item, index) => (
          <Descriptions.Item key={index} label={item.key}>
            {item.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  const renderAlbumDetail = () => {
    if (albumInfoLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!albumInfoData?.data) return <Empty description='暂无专辑信息' />;
    const { name, desc, company, lan, genre, list = [], aDate } = albumInfoData.data;

    return (
      <div className={styles['album-detail']}>
        <div className={styles['album-info']}>
          <img
            className={styles['album-cover']}
            src={getAlbumCover(searchParams.currentAlbum?.albumMid || '')}
            alt={name}
          />
          <div className={styles['album-content']}>
            <Title level={3}>{name}</Title>
            <Descriptions column={1}>
              <Descriptions.Item label='发行公司'>{company}</Descriptions.Item>
              <Descriptions.Item label='语种'>{lan}</Descriptions.Item>
              <Descriptions.Item label='流派'>{genre}</Descriptions.Item>
            </Descriptions>
            <div className={styles['album-desc']}>
              <Title level={5}>专辑简介</Title>
              <Paragraph>{desc || '暂无简介'}</Paragraph>
            </div>
          </div>
        </div>
        <div className={styles['album-songs']}>
          <Title level={4}>专辑歌曲</Title>
          <div className={styles['song-list']}>
            {list.map((song, index) => (
              <SongItem
                key={song.songmid}
                song={{
                  ...song,
                  id: song.songid,
                  mid: song.songmid,
                  name: song.songname,
                  subtitle: song.albumdesc,
                  album: {
                    mid: song.albummid,
                    name: song.albumname,
                    time_public: aDate,
                  },
                }}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabItems = useMemo(() => {
    const defaultTabs: TabsItemType[] = [
      {
        key: 'desc',
        label: '歌手简介',
        children: (
          <div className={styles['singer-desc']}>
            <Paragraph>{singerInfo?.desc}</Paragraph>
            <Title level={4} style={{ marginTop: 24 }}>
              基本信息
            </Title>
            {renderBasicInfo()}
          </div>
        ),
      },
      {
        key: 'songs',
        label: '热门歌曲',
        children: renderHotSongs(),
      },
      {
        key: 'albums',
        label: '专辑',
        children: renderAlbums(),
      },
    ];

    if (searchParams.currentAlbum) {
      defaultTabs.push({
        key: `album-${searchParams.currentAlbum.albumMid}`,
        label: searchParams.currentAlbum.albumName,
        children: renderAlbumDetail(),
        // closable: true,
      });
    }

    return defaultTabs;
  }, [singerInfo, songList, albumList, searchParams, albumInfoData, isSelectMode, selectedAlbums]);

  const handleTabChange = (key: string) => {
    setSearchParams({
      ...searchParams,
      activeKey: key,
    });
  };

  return (
    <div className={styles['singer-home']}>
      {loading ? (
        <Skeleton active avatar paragraph={{ rows: 4 }} />
      ) : (
        <>
          {/* 头部信息 */}
          <div className={styles['singer-header']}>
            <div className={styles['singer-avatar']}>
              <Avatar size={120} icon={<UserOutlined />} src={getSingerAvatar(mid)} />
            </div>
            <div className={styles['singer-info']}>
              <Title level={2}>
                {singerInfo?.basic.find((item) => item.key === '外文名')?.value}
              </Title>
              <div className={styles['singer-stats']}>
                <Tag icon={<UserOutlined />} color='blue'>
                  {starData?.num || 0} 粉丝
                </Tag>
                {singerInfo?.basic.map((item, index) => {
                  if (['国籍', '职业'].includes(item.key)) {
                    return (
                      <Tag key={index} color={item.key === '国籍' ? 'purple' : 'cyan'}>
                        {item.key}: {item.value}
                      </Tag>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* 主要内容 */}
          <div className={styles['singer-content']}>
            <Tabs
              activeKey={searchParams.activeKey}
              hideAdd
              onChange={handleTabChange}
              items={tabItems}
            />
          </div>
        </>
      )}
    </div>
  );
}

export interface AlbumDownLoadData {
  albumName: string;
  ablumCover: string;
  list: {
    songName: string;
    url: string;
    lrcContent: string;
  }[];
}
