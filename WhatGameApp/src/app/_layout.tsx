import "../global.css";
import { Slot } from "expo-router";
import NavTabs from "../../components/NavTabs";
import Header from "../../components/Header";

export default function Layout() {
  return (
    <>
      <Header />
      <Slot />
      <NavTabs />
    </>
  );
}
