import { SearchForm } from '@/components';
import type { Option as SearchFormOption } from '@/components/SearchForm';
import { Button, Card, Descriptions, Space, Tag } from 'antd';
import React from 'react';
import styles from './index.module.less';
import SubTitle from '@/components/SubTitle';

// 流程项接口
interface IProcessItem {
  title: string;
  id: string;
  version: string;
  status: string;
  publishTime: string;
  department: string;
  manager: string;
}

// 二级分类接口
interface ISecondCategory {
  title: string;
  children: IProcessItem[];
}

// 一级分类接口
interface IFirstCategory {
  title: string;
  children: ISecondCategory[];
}

const ProcessManagement: React.FC = () => {
  // 搜索表单配置
  const searchFormOptions: SearchFormOption[] = [
    // 关键字
    {
      name: 'keyword',
      label: '关键字',
      type: 'input',
      inputProps: {
        placeholder: '流程名称/流程编号/主...',
      },
    },
    // 流程分类
    {
      name: 'category',
      label: '流程分类',
      type: 'select',
      options: [
        {
          label: '教学管理',
          value: '教学管理',
        },
        {
          label: '行政管理',
          value: '行政管理',
        },
        {
          label: '科研管理',
          value: '科研管理',
        },
      ],
    },
  ];

  const { list, loading } = {
    list: data as IFirstCategory[],
    loading: false,
  };
  return (
    <div className={styles['process-management']}>
      {/* 搜索表单 */}
      <SearchForm options={searchFormOptions} />

      {/* 按钮层 */}
      <Space style={{ marginTop: -16 }}>
        <Button type='primary'>新增流程</Button>
        <Button type='default'>修改排序</Button>
      </Space>

      {list?.map((fCategory, index) => {
        return (
          // 一级分类
          <div key={index} className={styles['first-category-wrapper']}>
            {/* 一级分类标题 */}
            <div className={styles['first-category-title']}>{fCategory.title}</div>
            {/* 一级分类列表 */}
            <div className={styles['first-category-list']}>
              {fCategory.children?.map((sCategory, index) => {
                return (
                  // 二级分类
                  <div key={index} className={styles['second-category-wrapper']}>
                    {/* 二级分类标题 */}
                    <SubTitle title={sCategory.title} className={styles['second-category-title']} />
                    {/* 二级分类列表 */}
                    <div className={styles['second-category-list']}>
                      {sCategory.children?.map((item, index) => {
                        return (
                          // 列表项
                          <ProcessItem item={item} key={index} />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProcessManagement;

const ProcessItem = ({ item }: { item: IProcessItem }) => {
  const { title, id, version, status, publishTime, department, manager } = item || {};

  // 根据状态设置不同的标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '已发布':
        return '#0BC991';
      default:
        return '#FF6073';
    }
  };

  return (
    <div className={styles['process-item']}>
      <div className={styles['header']}>
        <div className={styles['left']}>
          <div className={styles['avatar']}></div>
        </div>
        <div className={styles['right']}>
          <div className={styles['title']}>{title}</div>
          <div className={styles['tags-wrapper']}>
            {[id, version].filter(Boolean).map((item, index) => {
              return (
                <Tag key={index} className={styles['tag']} color='#e7f0fd'>
                  {item}
                </Tag>
              );
            })}
          </div>
        </div>
      </div>

      <Descriptions column={1} size='small'>
        <Descriptions.Item label='发布时间'>{publishTime}</Descriptions.Item>
        <Descriptions.Item label='主管部门'>{department}</Descriptions.Item>
        <Descriptions.Item label='负责人'>{manager}</Descriptions.Item>
      </Descriptions>

      <div className={styles['footer']}>
        <Button variant='outlined' color='primary' shape='round'>
          流程详情
        </Button>
        <Button variant='outlined' color='primary' shape='round'>
          流程指南
        </Button>
        <Button variant='outlined' color='primary' shape='round'>
          版本信息
        </Button>
      </div>

      {/* 状态标签 */}
      <Tag color={getStatusColor(status)} className={styles['status']}>
        {status}
      </Tag>
    </div>
  );
};

// 模拟数据
const data = [
  {
    title: '教学管理',
    children: [
      {
        title: '学生管理',
        children: [
          {
            title: '学生入学流程',
            id: 'PROC001',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-03-20',
            department: '教务处',
            manager: '张三',
          },
          {
            title: '学生转专业流程',
            id: 'PROC002',
            version: 'V1.1.0',
            status: '草稿',
            publishTime: '2024-03-21',
            department: '教务处',
            manager: '李四',
          },
          {
            title: '学生休学流程',
            id: 'PROC003',
            version: 'V2.0.0',
            status: '已发布',
            publishTime: '2024-03-22',
            department: '学工处',
            manager: '王五',
          },
        ],
      },
      {
        title: '课程管理',
        children: [
          {
            title: '课程开设流程',
            id: 'PROC004',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-03-23',
            department: '教务处',
            manager: '赵六',
          },
          {
            title: '课程调整流程',
            id: 'PROC005',
            version: 'V1.2.0',
            status: '审核中',
            publishTime: '2024-03-24',
            department: '教务处',
            manager: '钱七',
          },
        ],
      },
    ],
  },
  {
    title: '行政管理',
    children: [
      {
        title: '人事管理',
        children: [
          {
            title: '教师入职流程',
            id: 'PROC006',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-03-25',
            department: '人事处',
            manager: '孙八',
          },
          {
            title: '职称评定流程',
            id: 'PROC007',
            version: 'V2.1.0',
            status: '已发布',
            publishTime: '2024-03-26',
            department: '人事处',
            manager: '周九',
          },
        ],
      },
      {
        title: '财务管理',
        children: [
          {
            title: '报销审批流程',
            id: 'PROC008',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-03-27',
            department: '财务处',
            manager: '吴十',
          },
          {
            title: '预算审批流程',
            id: 'PROC009',
            version: 'V1.1.0',
            status: '草稿',
            publishTime: '2024-03-28',
            department: '财务处',
            manager: '郑十一',
          },
        ],
      },
    ],
  },
  {
    title: '科研管理',
    children: [
      {
        title: '项目管理',
        children: [
          {
            title: '项目立项流程',
            id: 'PROC010',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-03-29',
            department: '科研处',
            manager: '王十二',
          },
          {
            title: '项目结题流程',
            id: 'PROC011',
            version: 'V1.0.0',
            status: '审核中',
            publishTime: '2024-03-30',
            department: '科研处',
            manager: '李十三',
          },
        ],
      },
      {
        title: '成果管理',
        children: [
          {
            title: '论文发表流程',
            id: 'PROC012',
            version: 'V2.0.0',
            status: '已发布',
            publishTime: '2024-03-31',
            department: '科研处',
            manager: '张十四',
          },
          {
            title: '专利申请流程',
            id: 'PROC013',
            version: 'V1.1.0',
            status: '已发布',
            publishTime: '2024-04-01',
            department: '科研处',
            manager: '刘十五',
          },
        ],
      },
    ],
  },
  {
    title: '设备管理',
    children: [
      {
        title: '实验室管理',
        children: [
          {
            title: '设备采购流程',
            id: 'PROC014',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-04-02',
            department: '实验室管理处',
            manager: '陈十六',
          },
          {
            title: '设备维修流程',
            id: 'PROC015',
            version: 'V1.2.0',
            status: '草稿',
            publishTime: '2024-04-03',
            department: '实验室管理处',
            manager: '杨十七',
          },
        ],
      },
      {
        title: '资产管理',
        children: [
          {
            title: '资产入库流程',
            id: 'PROC016',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-04-04',
            department: '资产管理处',
            manager: '黄十八',
          },
          {
            title: '资产报废流程',
            id: 'PROC017',
            version: 'V1.1.0',
            status: '审核中',
            publishTime: '2024-04-05',
            department: '资产管理处',
            manager: '赵十九',
          },
        ],
      },
    ],
  },
  {
    title: '信息化管理',
    children: [
      {
        title: '系统管理',
        children: [
          {
            title: '账号申请流程',
            id: 'PROC018',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-04-06',
            department: '信息化处',
            manager: '钱二十',
          },
          {
            title: '权限变更流程',
            id: 'PROC019',
            version: 'V2.0.0',
            status: '已发布',
            publishTime: '2024-04-07',
            department: '信息化处',
            manager: '孙二十一',
          },
        ],
      },
      {
        title: '运维管理',
        children: [
          {
            title: '系统部署流程',
            id: 'PROC020',
            version: 'V1.0.0',
            status: '已发布',
            publishTime: '2024-04-08',
            department: '信息化处',
            manager: '周二十二',
          },
          {
            title: '系统升级流程',
            id: 'PROC021',
            version: 'V1.1.0',
            status: '草稿',
            publishTime: '2024-04-09',
            department: '信息化处',
            manager: '吴二十三',
          },
        ],
      },
    ],
  },
];
