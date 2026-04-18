import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevBloom Studio",
  description: "A creative coding studio for kids to build real projects with code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
