declare module 'passport-discord' {
  import { Strategy as PassportStrategy } from 'passport-strategy';

  interface Profile {
    id: string;
    username: string;
    email?: string;
    avatar?: string;
    discriminator?: string;
  }

  interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => void
    );
    authenticate(req: any, options?: any): void;
  }

  export { Strategy };
}
