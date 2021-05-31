export default (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  numbers.sort((a, b) => a - b);
  const half = Math.floor(numbers.length / 2);
  if (numbers.length % 2) return numbers[half];
  return (numbers[half - 1] + numbers[half]) / 2.0;
};
