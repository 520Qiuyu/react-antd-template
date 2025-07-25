import { getSingerList } from '@/apis/qqMusic/singer';
import { CopyText, SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { useSearchParams } from '@/hooks';
import { useGetData } from '@/hooks/useGetData';
import type { SingerInfo } from '@/types/qqMusic/singer';
import { Spin } from 'antd';
import styles from './index.module.less';

export default function Singer() {
  const { searchParams, setSearchParams } = useSearchParams({});
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearch = (values: any) => {
    console.log('values', values);
    setSearchParams({
      ...searchParams,
      ...values,
    });
  };

  const { data, loading, getData } = useGetData(getSingerList, searchParams, {
    monitors: [searchParams],
  });
  const { singerlist } = data?.singerList?.data || {};
  const renderList = useMemo(() => {
    return singerlist?.filter((item) => item.singer_name.includes(keyword));
  }, [singerlist, keyword]);

  const searchOptions: SearchFormOption[] = [
    // 关键词
    {
      label: '关键词',
      name: 'keyword',
      type: 'input',
      inputProps: {
        placeholder: '请输入关键词',
        onChange: (e) => {
          setKeyword(e.target.value);
        },
      },
    },
    // 地区
    {
      label: '地区',
      name: 'area',
      type: 'select',
      options: data?.singerList?.data?.tags?.area.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    },
    // 流派
    {
      label: '流派',
      name: 'genre',
      type: 'select',
      options: data?.singerList?.data?.tags?.genre.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    },
    // 性别
    {
      label: '性别',
      name: 'sex',
      type: 'select',
      options: data?.singerList?.data?.tags?.sex.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    },
    // 索引
    {
      label: '索引',
      name: 'index',
      type: 'select',
      options: data?.singerList?.data?.tags?.index.map((item) => ({
        value: item.id,
        label: item.name,
      })),
    },
  ];

  const handleSingerClick = (item: SingerInfo) => {
    navigate(`/qq-music/singer-home/${item.singer_mid}`);
  };

  return (
    <div className={styles['singer']}>
      <SearchForm options={searchOptions} searchParams={searchParams} onSearch={handleSearch} />
      <div className={styles['singer-list-wrapper']}>
        {loading ? (
          <Spin
            size='large'
            style={{
              width: '100%',
              height: '50vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
        ) : (
          <div className={styles['singer-list']}>
            {renderList?.map((item) => (
              <div className={styles['singer-item']} key={item.singer_id}>
                <div className={styles['singer-avatar']} onClick={() => handleSingerClick(item)}>
                  <img src={item.singer_pic} className={styles['avatar']} alt={item.singer_name} />
                </div>
                <div className={styles['singer-info']}>
                  <div className={styles['singer-name']}>{item.singer_name}</div>
                  <div className={styles['singer-meta']}>
                    <span className={styles['singer-id']}>
                      ID：
                      <CopyText text={item.singer_id.toString()} />
                    </span>
                    <span className={styles['singer-mid']}>
                      MID：
                      <CopyText text={item.singer_mid} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
