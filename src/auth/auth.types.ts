import { UserRole } from '../common/enums/user-role.enum';
import { UserStatus } from '../common/enums/user-status.enum';

export interface MagicLinkSentResponse {
  message: string;
  email: string;
  _dev_token: string;
}

export interface VerifyResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    hasCompletedOnboarding: boolean;
    onboardingCurrentStep: number;
  };
}
