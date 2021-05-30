export default async <T>(list: T[], condition: (item: T) => PromiseLike<boolean>): Promise<T[]> => {
  const result: T[] = [];
  (await Promise.all(list.map((item) => condition(item)))).forEach((conditionResult, index) => {
    if (conditionResult) {
      result.push(list[index]);
    }
  });
  return result;
};
