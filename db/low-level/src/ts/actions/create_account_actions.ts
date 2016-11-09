import ACTION_TYPES from './action_types';

export const setCreateAccountProcessing = () => ({
  type: ACTION_TYPES.SET_CREATE_ACCOUNT_PROCESSING
});

export const setCreateAccountError = (error) => ({
  type: ACTION_TYPES.SET_CREATE_ACCOUNT_ERROR,
  error
});
