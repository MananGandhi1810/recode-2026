import "./globals.css";

export const metadata = {
  title: "Nexus | Professional Team Collaboration",
  description: "A secure, fast, and organized messaging platform for high-performance teams.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
