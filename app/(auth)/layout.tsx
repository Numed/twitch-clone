import React from "react";
import { Logo } from "./_components/logo";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center space-y-6">
      <Logo/>
      {children}
    </div>
  );
}
