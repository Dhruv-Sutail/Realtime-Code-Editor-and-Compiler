import React from "react";

const PageNotFound = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        flexFlow: "column",
      }}
    >
      <div style={{ color: "white", fontSize: "50px" }}>
        404 - Page Not Found!
      </div>
      <a
        style={{ paddingTop: "10px", fontSize: "25px" }}
        href="/"
        className="createNewBtn"
      >
        Go Back
      </a>
    </div>
  );
};

export default PageNotFound;
