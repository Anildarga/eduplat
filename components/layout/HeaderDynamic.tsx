"use client";

import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), {
  ssr: false,
});

export default Header;
