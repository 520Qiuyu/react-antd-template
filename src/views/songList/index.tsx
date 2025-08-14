import { SearchForm, SubTitle } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import styles from './index.module.less';
import { useGetData, useSearchParams } from '@/hooks';
import { batchGetSongLists, getSongListCategories } from '@/apis/qqMusic/songList';
import type { TreeSelectProps } from 'antd';
import type { SongListDataItem, ListItem } from '@/types/qqMusic/songList';
import SongListCard from './components/SongListCard';

const defaultSearchParams = {
  categoryIds: [6],
  sortId: 5,
  page: 1,
  limit: 20,
};

export default function SongList() {
  const { searchParams, setSearchParams } = useSearchParams(defaultSearchParams);

  /** 歌单分类配置项 */
  const { data: songListCategories } = useGetData(getSongListCategories);
  const categoryOptions = useMemo(() => {
    return songListCategories?.data?.categories.map((item) => ({
      label: item.categoryGroupName,
      value: item.categoryGroupName,
      checkable: false,
      children: item.items.map((item) => ({
        label: item.categoryName,
        value: item.categoryId,
      })),
    }));
  }, [songListCategories]);

  // categoryId -> categoryName 映射（用于小标题）
  const categoryIdToName = useMemo(() => {
    const map = new Map<number, string>();
    songListCategories?.data?.categories.forEach((group) => {
      group.items.forEach((item) => {
        map.set(item.categoryId, item.categoryName);
      });
    });
    return map;
  }, [songListCategories]);
  // 搜索表单配置项
  const searchOptions: SearchFormOption[] = [
    // 分类
    {
      label: '分类',
      name: 'categoryIds',
      type: 'treeSelect',
      inputProps: {
        treeData: categoryOptions,
      } as TreeSelectProps,
    },
    // 排序
    {
      label: '排序',
      name: 'sortId',
      type: 'select',
      options: [
        { label: '默认', value: 1 },
        { label: '最新', value: 2 },
        { label: '最热', value: 3 },
        { label: '评分', value: 4 },
        { label: 'none', value: 5 },
      ],
      inputProps: {
        mode: undefined,
        allowClear: true,
      },
    },
  ];

  const handleSearch = (values: any) => {
    console.log('values', values);
    setSearchParams({
      ...searchParams,
      ...values,
    });
  };

  const { data: songLists } = useGetData<SongListDataItem[]>(batchGetSongLists, searchParams, {
    monitors: [searchParams],
    returnFunction: () => !searchParams.categoryIds?.length,
    initialValue: [],
  });

  console.log('songLists', songLists);

  return (
    <div className={styles['song-list-container']}>
      {/* 上方搜索表单 */}
      <SearchForm options={searchOptions} searchParams={searchParams} onSearch={handleSearch} />

      {/* 中间的歌单列表 */}
      <div className={styles['song-list-list']}>
        {songLists?.map((group) => {
          const title = categoryIdToName.get(group.categoryId) || `分类 ${group.categoryId}`;
          return (
            <section className={styles['category-section']} key={`${group.categoryId}-${group.sortId}`}>
              <SubTitle title={title} className={styles['category-title']} />
              <div className={styles['card-grid']} role='list' aria-label={title}>
                {group.list.map((item: ListItem) => (
                  <SongListCard key={item.dissid} data={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
