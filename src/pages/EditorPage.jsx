import React, { useEffect, useRef } from "react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import CodePile from "../images/codepile.png";
import { initSocket } from "../socket";
import toast from "react-hot-toast";
import {
  useLocation,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";
import axios from "axios";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();

  const [clients, setClients] = React.useState([]);
  const [language, setLanguage] = React.useState("cpp");
  const [output, setOutput] = React.useState("");
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [jobId, setJobId] = React.useState("");

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        userName: location.state?.userName,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, userName, socketId }) => {
          if (userName !== location.state?.userName) {
            toast.success(`${userName} joined the Room!`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            output: output,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, userName }) => {
        toast.success(`${userName} left the Room!`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };

    init();
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
    };
  }, []);

  async function copyRoomID() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id Copied to Clipboard!");
    } catch (error) {
      toast.error(error);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async () => {
    const payload = {
      language: language,
      code: codeRef.current,
    };

    if (codeRef.current === null || codeRef.current.trim() === "") {
      toast.error("Please Enter Valid Code!");
    } else {
      try {
        setJobId("");
        setStatus("");
        setOutput("");
        const { data } = await axios.post("http://localhost:5000/run", payload);
        setJobId(data.jobId);
        setError("");
        let intervalId;

        intervalId = setInterval(async () => {
          const { data: dataRes } = await axios.get(
            "http://localhost:5000/status",
            { params: { id: data.jobId } }
          );
          const { success, job, error } = dataRes;
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            setStatus(jobStatus);
            if (jobStatus === "pending") return;
            setOutput(jobOutput);
            clearInterval(intervalId);
          } else {
            setStatus("Error: Please Try Again");
            console.log(error);
            clearInterval(intervalId);
            setError(error);
          }
        }, 1000);
      } catch ({ response }) {
        if (response) {
          const errorMessage = response.data.error.stderr;
          setOutput("");
          setError(errorMessage);
        } else {
          toast.error("Error in Server Connection!");
        }
      }
    }
  };

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <div
              style={{ height: "80px", display: "flex", alignItems: "center" }}
            >
              <img
                src={CodePile}
                alt="CodePile Logo"
                width="30%"
                height="100%"
              />
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    fontSize: "25px",
                    paddingLeft: "10px",
                    fontWeight: "bold",
                  }}
                >
                  Code Pile
                </div>
              </div>
            </div>
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client userName={client.username} key={client.socketId} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomID}>
          Copy Room ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
      </div>
      <div className="editorWrap">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "10px",
            paddingBottom: "10px",
            paddingRight: "10px",
          }}
        >
          <div className="btn copyBtn">
            <select
              name="language"
              style={{ width: "125px", fontSize: "20px", borderRadius: "5px" }}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="cpp">C++</option>
              <option value="py">Python</option>
              <option value="js">Javascript</option>
            </select>
          </div>
          <button className="btn copyBtn" onClick={handleSubmit}>
            Submit Code
          </button>
        </div>
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />

        <div style={{ height: "38vh", color: "white" }}>
          {output && (
            <>
              <h2 style={{ paddingLeft: "10px" }}>Output:</h2>
              {output && <p style={{ paddingLeft: "10px" }}>{output}</p>}
            </>
          )}
          {error && (
            <>
              <h2 style={{ paddingLeft: "10px" }}>Error:</h2>
              {error && (
                <p style={{ paddingLeft: "10px", color: "red" }}>{error}</p>
              )}
            </>
          )}
          <p style={{ paddingLeft: "10px" }}>{status}</p>
          <p style={{ paddingLeft: "10px" }}>{jobId && `JobID: ${jobId}`}</p>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
