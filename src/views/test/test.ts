import fs from 'fs';

const BASE_URL = 'https://xgxt.sysu.edu.cn';
const cookie =
  'code_time_ec583190dcd12bca757dd13df10f59c3=1783328836; token_ec583190dcd12bca757dd13df10f59c3=9eb7b1bb950ac1f2ff108652f09efe22; code_phone_ec583190dcd12bca757dd13df10f59c3=0; sn_ec583190dcd12bca757dd13df10f59c3=2b7c19389da0af487e583fbd73944d6e; redirect_url_ec583190dcd12bca757dd13df10f59c3=https%3A%2F%2Fwww.sysu.edu.cn; ssoUsername=I9L02xJfZ8wKWxsxkUs8oCh43h5vV5bAiDHPn+1P818z8/m9UuDPjPwfWec0ZuI3ClNK7ktRLZBmtXwAc3WHnEmzhLJM7VxHj4O9A5FZznCcAKt43JV++U7t0d5qgf1iyzjlWoiEeNG7ZfrA4X3P23b/W9u2BH5d5gUhmFuD4O8=; captchaId=21b5c7f1-4111-4624-bace-8bf9fe60640c; access_token=mptyXuWzrTHoJG8i0Vamh047IP7nE9eUgZhtsVH2AY5BP-JJK5NDM8IyiDsLQLrmcRlFFIXXwvj2zfii9mAUaNlY4EndnvnsIma6ymyZvU_4xks-zkMyrmTMTlbssmXP; access_token_Refresh=Fz8hEzhuEgIB6w0UhPwbFpuOus04dLiJ7kMGpC59XtGlp18V6KGgslTgzUSMcaPEf2bfqvH8dWgVw1ByILjbwgxe2WUoUp__mOU4a0fzlxUw3tK8gCrzn4cHf1Mf9NKu';
const loginUserId = 'zengweijin';

/** 退宿学生列表项 */
interface MoveOutStudent {
  id: string;
  studentNumber: string;
  studentName: string;
  gender: string;
  campus: string;
  buildingName: string;
  floorName: string;
  roomNumber: string;
  bedNumber: string;
  type: string;
  auditPassDate: string | null;
  confirmDate: string | null;
  confirmStatus: string | null;
  academy: string;
  major: string;
  grade: string;
  trainingLevel: string;
  staySchoolStatus: string;
  studentStatus: string;
  contactNumber: string;
  bedId: string;
  xslcjd: string;
  grysrl: string | null;
  fjwlrl: string;
  ktykq: string | null;
  sdzyk: string | null;
  ldfs: string | null;
  wlltjlczsj: string | null;
  zgqrsj: string | null;
  sgqrsj: string | null;
  zgshsj: string | null;
  sgqrzt: string;
  sfyx: string | null;
}

interface MoveOutListResponse {
  data: {
    list: MoveOutStudent[];
  };
}

const getAllUsers = async (): Promise<MoveOutStudent[]> => {
  const res = await fetch(
    `${BASE_URL}/ssgl/api/sm-ssgl/stu/move-out?pageNum=1&pageSize=100000&confirm=false&audit=false`,
    {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
        'access-control-allow-headers': 'Origin, Content-Type, X-Auth-Token',
        'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'access-control-allow-origin': '*',
        'cache-control': 'no-cache',
        loginuserid: loginUserId,
        loginuserorgid: '',
        pragma: 'no-cache',
        'x-requested-with': 'XMLHttpRequest',
        cookie,
        Referer: 'http://172.22.43.162:50300/ssgl/',
      },
      body: null,
      method: 'GET',
    },
  );
  const data = (await res.json()) as MoveOutListResponse;
  console.log('data', data);
  return data.data.list;
};

const getLocalUsers = async () => {
  const usersStr = fs.readFileSync('./学号列表.txt', 'utf-8');
  const users = usersStr?.split(',');
  return users;
};

// 批量确认退宿 每次最多一百
const confirmBatchMoveOut = async (userList: MoveOutStudent[]) => {
  const confirmData = userList.map((user) => ({
    bedId: user.bedId,
    studentNumber: user.studentNumber,
    isExit: true,
    isCheck: true,
    grys: '已退',
    ktykq: '已退',
    shdyzk: '已退',
    lldfz: '已退',
    blyj: '同意办理',
  }));

  const res = await fetch(`${BASE_URL}/ssgl/api/sm-ssgl/stu/move-out/confirm/batch`, {
    headers: {
      accept: 'application/json',
      'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8',
      'access-control-allow-headers': 'Origin, Content-Type, X-Auth-Token',
      'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'access-control-allow-origin': '*',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      loginuserid: loginUserId,
      loginuserorgid: '',
      pragma: 'no-cache',
      'x-requested-with': 'XMLHttpRequest',
      cookie,
      Referer: 'http://172.22.43.162:50300/ssgl/',
    },
    body: JSON.stringify(confirmData),
    method: 'POST',
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to confirm batch move out: ${error}`);
  }
  return res.json();
};

function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce<T[][]>((acc, item, index) => {
    const chunkIndex = Math.floor(index / size);
    if (!acc[chunkIndex]) {
      acc[chunkIndex] = [];
    }
    acc[chunkIndex].push(item);
    return acc;
  }, []);
}

async function main() {
  const users = await getAllUsers();
  const localUsers = await getLocalUsers();
  console.log(
    'users.length',
    users.length,
    'localUsers.length',
    localUsers.length,
  );
  const newUsers = users.filter((user) => localUsers.includes(user.studentNumber));
  console.log('newUsers.length', newUsers.length);
  const chunks = chunk(newUsers, 100);
  const results = await Promise.all(chunks.map((batch) => confirmBatchMoveOut(batch)));
  console.log(
    '结果',
    results.map((result, index) => ({
      操作结果: result.data,
      作用学生: chunks[index],
    })),
  );
}

main();
