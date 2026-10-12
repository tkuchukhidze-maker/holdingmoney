import { betterAuth } from 'better-auth';
import { database } from './db.ts';
import { queueEmail } from './mail.ts';
import { appOrigin, HttpError } from './http.ts';
function createAuth(){
  const secret=process.env.BETTER_AUTH_SECRET;
  if(!secret||secret.length<32||secret.startsWith('CHANGE_ME'))throw new Error('A random BETTER_AUTH_SECRET of at least 32 characters is required.');
  const requireVerification=process.env.NODE_ENV==='production'||process.env.REQUIRE_EMAIL_VERIFICATION!=='false';
  return betterAuth({
    appName:'Episode Holding',secret,baseURL:appOrigin(),trustedOrigins:[appOrigin()],database:database(),
    emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,autoSignIn:false,
      requireEmailVerification:requireVerification,revokeSessionsOnPasswordReset:true,
      sendResetPassword:async({user,url})=>{await queueEmail(user.email,'Reset your Episode password',url);},
    },
    emailVerification:{sendOnSignUp:true,autoSignInAfterVerification:false,
      sendVerificationEmail:async({user,url})=>{await queueEmail(user.email,'Verify your Episode email',url);},
    },
    session:{expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
    rateLimit:{enabled:true,storage:'database',window:60,max:100},
    advanced:{useSecureCookies:process.env.NODE_ENV==='production',
      ipAddress:{ipAddressHeaders:process.env.TRUST_PROXY==='true'?['x-forwarded-for']:[]},
      defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},
    },
  });
}
let instance:ReturnType<typeof createAuth>|undefined;
export function auth(){return instance??=createAuth();}
export async function requireUser(request:Request){
  const session=await auth().api.getSession({headers:request.headers});
  if(!session)throw new HttpError(401,'Please sign in to continue.');
  if(!session.user.emailVerified)throw new HttpError(403,'Verify your email before continuing.');
  return session.user;
}
