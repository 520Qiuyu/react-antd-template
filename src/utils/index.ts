/**
 * 并发执行Promise数组,可限制同时执行的最大数量
 * @param {Array<() => Promise<any>>} promiseArray - Promise函数数组,每个元素都应该是返回Promise的函数
 * @param {number} [limit=6] - 最大并发数,默认为6
 * @returns {Promise<Array<any>>} 返回与输入数组顺序相同的结果数组
 * @throws {Error} 当输入参数不合法时抛出错误
 * @example
 * const tasks = [
 *   () => fetch('/api/1'),
 *   () => fetch('/api/2'),
 *   () => fetch('/api/3')
 * ];
 * const results = await promiseLimit(tasks, 2);
 */
export const promiseLimit = (promiseArray, limit = 6) => {
  if (!Array.isArray(promiseArray)) {
    throw new Error('第一个参数必须是数组');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('并发限制必须是正整数');
  }

  // 处理空数组情况
  if (promiseArray.length === 0) {
    return Promise.resolve([]);
  }

  return new Promise((resolve, reject) => {
    const results = new Array(promiseArray.length);
    let completed = 0;
    let currentIndex = 0;

    // 执行单个任务
    const runTask = async () => {
      // 获取当前任务索引
      const index = currentIndex++;
      // 如果所有任务都已分配，则返回
      if (index >= promiseArray.length) {
        return;
      }
      try {
        const promise = promiseArray[index];
        if (typeof promise !== 'function') {
          throw new Error(`数组中索引为 ${index} 的元素不是函数`);
        }
        results[index] = await promise();
      } catch (error) {
        results[index] = error;
      }
      completed++;
      // 如果还有未分配的任务，继续执行
      if (currentIndex < promiseArray.length) {
        runTask();
      }
      // 所有任务都完成时，返回结果
      else if (completed === promiseArray.length) {
        resolve(results);
      }
    };

    // 启动初始批次的任务
    const tasksToStart = Math.min(limit, promiseArray.length);
    for (let i = 0; i < tasksToStart; i++) {
      try {
        runTask();
      } catch (error) {
        reject(error);
      }
    }
  });
};
