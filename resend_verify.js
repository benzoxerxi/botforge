const crypto = require("crypto");
const { execSync } = require("child_process");
const { Resend } = require("resend");
const fs = require("fs");

const email = "erekle.kinkladze@karcher.com";
const key = fs.readFileSync("/root/.openclaw/workspace/botforge/.env","utf8").match(/RESEND_API_KEY="(\S+)"/)[1];
const token = crypto.randomBytes(32).toString("hex");

// Insert token
const psqlCmd = [
  `docker exec hr-platform-db-1 psql -U hr_user -d botforge -c`,
  `INSERT INTO "EmailVerificationToken"(id,email,token,"expiresAt") VALUES(gen_random_uuid()::text,'${email}','${token}',NOW()+INTERVAL'24 hours')`
];
execSync(psqlCmd.join(" "), { stdio: "pipe" });

console.log("TOKEN:", token);
const verifyUrl = "https://chat.benzos.uk/api/verify-email?token=" + token;
const html = "<p>Click to verify: <a href='" + verifyUrl + "'>" + verifyUrl + "</a></p>";

const resend = new Resend(key);
resend.emails.send({
  from: "BotForge <noreply@benzos.uk>",
  to: email,
  subject: "Verify Your BotForge Account",
  html: html
}).then(({data,error}) => {
  if (error) console.log("ERROR:", JSON.stringify(error));
  else console.log("SENT ✅", data?.id);
}).catch(e => console.log("EXCEPT:", e.message));
