import { useNavigation } from "react-router";

export default function NotFound() {
  const nav = useNavigation();
  return (
    <div>
      <h1>404 – Page Not Found</h1>
      <p>No route matches the URL.</p>
      <p>Navigation state: {nav.state}</p>
    </div>
  );
}