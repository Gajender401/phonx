import api from './axios';

export interface AccountDetails {
  companyName: string;
  adminName: string;
  email: string;
  phoneNumber: string;
  companySize: string;
}

export interface UpdateAccountDetailsRequest {
  companyName: string;
  adminName: string;
  email: string;
  phoneNumber: string;
  companySize: string;
}

export interface InitiatePasswordResetRequest {
  email: string;
}

export interface ConfirmPasswordResetRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface ConfirmPasswordResetAuthenticatedRequest {
  code: string;
  newPassword: string;
}

export const getAccountDetails = async (): Promise<AccountDetails> => {
  try {
    const { data } = await api.get('/settings/account');
    return data.data;
  } catch (error) {
    throw error;
  }
};

export const updateAccountDetails = async (accountData: UpdateAccountDetailsRequest): Promise<AccountDetails> => {
  try {
    const { data } = await api.put('/settings/account', accountData);
    return data.data;
  } catch (error) {
    throw error;
  }
};

export const initiatePasswordReset = async (): Promise<{ message: string }> => {
  try {
    const { data } = await api.post('/settings/password-reset');
    return { message: data.message };
  } catch (error) {
    throw error;
  }
};

// Public password reset functions (no authentication required)
export const initiatePasswordResetPublic = async (requestData: InitiatePasswordResetRequest): Promise<{ message: string }> => {
  try {
    const { data } = await api.post('/settings/password-reset/public', requestData);
    return { message: data.message };
  } catch (error) {
    throw error;
  }
};

export const confirmPasswordResetPublic = async (requestData: ConfirmPasswordResetRequest): Promise<{ message: string }> => {
  try {
    const { data } = await api.post('/settings/password-reset/public/confirm', requestData);
    return { message: data.message };
  } catch (error) {
    throw error;
  }
};

export const confirmPasswordReset = async (requestData: ConfirmPasswordResetAuthenticatedRequest): Promise<{ message: string }> => {
  try {
    const { data } = await api.post('/settings/password-reset/confirm', requestData);
    return { message: data.message };
  } catch (error) {
    throw error;
  }
}; 