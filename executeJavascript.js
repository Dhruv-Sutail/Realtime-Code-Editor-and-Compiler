const { exec } = require("pkg");

const executeJavascript = (filepath) => {
  return new Promise((resolve, reject) => {
    console.log("Promise");
    exec([filepath], (error, stdout, stderr) => {
      console.log("exec");
      error && reject({ error, stderr });
      stderr && reject(stderr);
      resolve(stdout);
    });
  });
};

module.exports = {
  executeJavascript,
};
