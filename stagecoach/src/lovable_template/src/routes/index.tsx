// The site itself is the static pages in public/. This route only sends visitors to the home page.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: GoHome });

function GoHome() {
  useEffect(() => { window.location.replace("/home.html"); }, []);
  return null;
}
