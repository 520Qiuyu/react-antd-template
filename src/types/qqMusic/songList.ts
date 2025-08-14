export interface CategoryGroup {
  categoryGroupName: string;
  items: CategoryItem[];
  usable: number;
}

export interface CategoryItem {
  allsorts: SortOption[];
  categoryId: number;
  categoryName: string;
  usable: number;
}

export interface SortOption {
  sortId: number;
  sortName: string;
}

export interface SongListCategoriesResponseData {
  code: number;
  subcode: number;
  message: string;
  default: number;
  data: {
    categories: CategoryGroup[];
  };
}


export interface SongListDataItem {
  uin: number;
  categoryId: number;
  sortId: number;
  sum: number;
  sin: number;
  ein: number;
  list: ListItem[];
}

export interface ListItem {
  dissid: string;
  createtime: string;
  commit_time: string;
  dissname: string;
  imgurl: string;
  introduction: string;
  listennum: number;
  score: number;
  version: number;
  creator: Creator;
}

export interface Creator {
  type: number;
  qq: number;
  encrypt_uin: string;
  name: string;
  isVip: number;
  avatarUrl: string;
  followflag: number;
}
