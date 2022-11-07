const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const ACTIONS = require("./src/Actions");

const app = express();
const { generateFile } = require("./generateFile");
const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");
const { executeJavascript } = require("./executeJavascript");
const Job = require("./models/Job");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

mongoose.connect(
  "mongodb://localhost/CodeEditor",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (error) => {
    if (error) {
      console.log("Error", error);
      process.exit(1);
    }
    console.log("Successful Connnection!");
  }
);

const server = http.createServer(app);

const io = new Server(server);
const PORT = process.env.PORT || 5000;

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, userName }) => {
    userSocketMap[socket.id] = userName;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        userName,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code, output }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code, output });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        userName: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

app.get("/status", async (req, res) => {
  const jobId = req.query.id;
  console.log("Status Request", jobId);
  if (jobId === undefined) {
    return res.status(400).json({ success: false, error: "Missing Id Params" });
  }
  try {
    const job = await Job.findById(jobId);
    if (job === undefined) {
      return res
        .status(404)
        .json({ success: "false", error: "Invalid Job Id" });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    return res.status(400).json({ sucess: false, error });
  }
});

app.post("/run", async (req, res) => {
  const { language = "cpp", code } = req.body;

  if (code === undefined) {
    return res
      .status(400)
      .json({ sucess: "false", error: "Empty Code Module" });
  }

  let job;
  try {
    const filepath = await generateFile(language, code);

    job = await new Job({ language, filepath }).save();
    const jobId = job["_id"];
    console.log(job);
    res.status(201).json({ success: true, jobId });

    job["startedAt"] = new Date();

    let output;
    console.log(filepath);
    if (language === "cpp") {
      output = await executeCpp(filepath);
    } else if (language === "py") {
      output = await executePy(filepath);
    } else {
      output = await executeJavascript(filepath);
    }
    job["completedAt"] = new Date();
    job["status"] = "success";
    job["output"] = output;
    await job.save();

    console.log(job);

    // return res.json({ filepath, output });
  } catch (error) {
    job["completedAt"] = new Date();
    job["status"] = "error";
    job["output"] = JSON.stringify({ error });
    await job.save();
    console.log(job);
    // res.status(500).json({ error });
  }
});

server.listen(PORT, () => {
  console.log("Listening on PORT:", PORT);
});
