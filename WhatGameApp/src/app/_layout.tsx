import "../global.css";
import { Slot } from "expo-router";
import NavTabs from "../../components/NavTabs";

export default function Layout() {
  return (
    <>
      <Slot />
      <NavTabs />
    </>
  );
}
