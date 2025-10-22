import React from "react";
import {Link, Outlet, useNavigation} from "react-router";

export default function RootLayout() {
  const navigation = useNavigation();
  return (
    <React.Fragment>
      {1 < 0 && (
        <header style={{padding: "1rem", background: "#eee"}}>
          <nav style={{display: "flex", gap: "1rem"}}>
          <Link to="/">Home</Link>
          <Link to="/pdf">PDF</Link>
        </nav>
      </header>
      )}
      
      {navigation.state === "loading" && (
        <div style={{ padding: "1rem", color: "blue" }}>Loading…</div>
      )}
      
      <main>
        <Outlet />
      </main>
    </React.Fragment>
  );
}