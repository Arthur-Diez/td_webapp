import React, { useState, useEffect } from "react";
import WebApp from "@twa-dev/sdk";
import Tasks from "./components/Tasks";
import Calendar from "./components/Calendar";
import Profile from "./components/Profile";
import Tabs from "./components/Tabs";
import "./App.css";

function App() {
  const [tab, setTab] = useState("tasks");

  useEffect(() => {
    WebApp.ready();
    console.log(WebApp.initDataUnsafe); // Telegram user info
  }, []);

  return (
    <div className="App">
      <div className="main">
        {tab === "tasks" && <Tasks />}
        {tab === "calendar" && <Calendar />}
        {tab === "profile" && <Profile />}
      </div>
      <Tabs current={tab} onChange={setTab} />
    </div>
  );
}

export default App;














