export type DataHuntedValue = string[];

export type DataHunted = DataHuntedValue[];

export function unionDataHunted<T>(
  headerNamesHunted: string[],
  dataHunted: string[][]
): T[] {
  const unionRepository = [] as T[];

  dataHunted.forEach((data) => {
    let unionObject = {} as T;

    data.forEach((value, index) => {
      const union = {
        [headerNamesHunted[index]]: value,
      };

      unionObject = {
        ...unionObject,
        ...union,
      };
    });

    unionRepository.push(unionObject);
  });

  return unionRepository;
}
