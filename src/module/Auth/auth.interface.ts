export interface ILoginUser {
  email: string;
  password: string;
}

export interface ISendOtp {
  email: string;
  name?: string;
}

export interface IVerifyOtp {
  email: string;
  otpCode: string;
}

export interface IGoogleLogin {
  idToken: string;
}
