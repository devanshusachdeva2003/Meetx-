const path = require("path");
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV.trim()}`
  : ".env.local";
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

const app = require("./app");
if (!process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

module.exports = app;
