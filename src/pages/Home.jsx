import React from "react";
import CodePile from "../images/codepile.png";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [roomId, setRoomId] = React.useState("");
  const [userName, setUserName] = React.useState("");

  const navigate = useNavigate();

  const createNewRoom = (e) => {
    e.preventDefault();
    setRoomId(uuidv4());
    toast.success("Created a new Room!");
  };

  const joinRoom = () => {
    if (!roomId.trim() || !userName.trim()) {
      toast.error("Room-Id or UserName Empty!");
      return;
    }
    navigate(`/editor/${roomId}`, { state: { userName } });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        <div style={{ height: "80px", display: "flex", alignItems: "center" }}>
          <img src={CodePile} alt="CodePile Logo" width="20%" height="100%" />
          <div style={{ width: "100%" }}>
            <div style={{ fontSize: "40px", paddingLeft: "20px" }}>
              Code Pile
            </div>
            <div
              style={{
                paddingLeft: "23px",
                paddingTop: "10px",
                color: "rebeccapurple",
              }}
            >
              Real Time Collabration and Compilation!
            </div>
          </div>
        </div>
        <h4 className="mainLable">Paste Invitation Room ID</h4>
        <div className="inputGroup">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
            className="inputBox"
            placeholder="Room ID"
          />
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyUp={handleInputEnter}
            className="inputBox"
            placeholder="UserName"
          />
          <button className="btn joinBtn" onClick={joinRoom}>
            Join
          </button>
          <span className="createInfo">
            If you don't have an invite then create &nbsp;
            <a onClick={createNewRoom} href="/" className="createNewBtn">
              New Room
            </a>
          </span>
        </div>
      </div>
      <footer>
        <h4 className="">
          Built with 💜 by{" "}
          <a href="https://dhruv-sutail.herokuapp.com/">Dhruv Sutail</a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
