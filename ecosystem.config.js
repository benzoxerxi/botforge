module.exports = {
  apps: [{
    name: 'botforge',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/root/.openclaw/workspace/botforge',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://hr_user:hr_pass@localhost:5432/botforge?schema=public',
      NEXTAUTH_URL: 'https://chat.benzos.uk',
      NEXTAUTH_SECRET: 'botforge-super-secret-key-change-it-later-12345',
      AUTH_TRUST_HOST: 'true',
      RESEND_API_KEY: 're_QRF6Ahhj_CWd9FkXeou2vRGE5QR7wTTA3',
      NEXT_PUBLIC_APP_URL: 'https://chat.benzos.uk',
    },
  }]
};
