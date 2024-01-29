export const calculateFee = (adjustmnet: number) => {
  // if adjustment is 100, the percent is 0%
  // if adjustment is 110, the percent is 10%
  // if adjustment is 90, the percent is -10%
  if (adjustmnet > 100) {
    return adjustmnet - 100;
  }
  if (adjustmnet < 100) {
    return 100 - adjustmnet;
  }
  return 0;
};
