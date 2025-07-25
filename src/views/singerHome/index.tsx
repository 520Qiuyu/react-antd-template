import {
  getAlbumCover,
  getAlbumInfo,
  getSingerAlbum,
  getSingerAvatar,
  getSingerDesc,
  getSingerHotsong,
  getSingerStarNum,
} from '@/apis/qqMusic/singer';
import { useGetData, useSearchParams } from '@/hooks';
import type { AlbumInfo, SongInfo } from '@/types/qqMusic/singer';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Card, Descriptions, Empty, Skeleton, Tabs, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import styles from './index.module.less';

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
    limit: 400,
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
  const albumList = albumData?.singer?.data?.albumList || [];

  const handleAlbumClick = (album: AlbumInfo) => {
    setSearchParams({
      ...searchParams,
      currentAlbum: album,
      activeKey: `album-${album.albumMid}`,
    });
  };

  const renderHotSongs = () => {
    if (songLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!songList.length) return <Empty description='暂无热门歌曲' />;
    return (
      <div className={styles['hot-songs']}>
        {songList.map((song: SongInfo, index: number) => (
          <div key={song.mid} className={styles['song-item']}>
            <div className={styles['song-index']}>{index + 1}</div>
            <div className={styles['song-info']}>
              <div className={styles['song-name']}>
                <Text>{song.name}</Text>
                {song.subtitle && <Tag color='blue'>{song.subtitle}</Tag>}
              </div>
              <div className={styles['song-meta']}>
                <Text type='secondary'>{song.album?.name}</Text>
                <Text type='secondary'>· {song.interval}秒</Text>
              </div>
            </div>
            <PlayCircleOutlined className={styles['play-icon']} />
          </div>
        ))}
      </div>
    );
  };

  const renderAlbums = () => {
    if (albumLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
    if (!albumList.length) return <Empty description='暂无专辑' />;
    return (
      <div className={styles['albums-grid']}>
        {albumList.map((item: AlbumInfo) => (
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
              <img
                className={styles['album-cover']}
                alt={item.albumName}
                src={getAlbumCover(item.albumMid)}
              />
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
    const { name, desc, company, lan, genre, list = [] } = albumInfoData.data;

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
              <div key={song.songmid} className={styles['song-item']}>
                <div className={styles['song-index']}>{index + 1}</div>
                <div className={styles['song-info']}>
                  <div className={styles['song-name']}>
                    <Text>{song.songname}</Text>
                    {song.albumdesc && <Tag color='blue'>{song.albumdesc}</Tag>}
                  </div>
                  <div className={styles['song-meta']}>
                    <Text type='secondary'>{song.singer?.map((s) => s.name).join(' / ')}</Text>
                    <Text type='secondary'>
                      · {Math.floor(song.interval / 60)}:
                      {(song.interval % 60).toString().padStart(2, '0')}
                    </Text>
                  </div>
                </div>
                <PlayCircleOutlined className={styles['play-icon']} />
              </div>
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
  }, [singerInfo, songList, albumList, searchParams, albumInfoData]);

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
