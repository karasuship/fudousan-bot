import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "賃貸費用チェッカー｜賃貸契約の費用を確認しよう",
  description:
    "更新料・再契約料・仲介手数料・鍵交換代・清掃代など、賃貸契約の費用について確認すべき点と確認メール文案を生成します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-slate-800 antialiased font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
