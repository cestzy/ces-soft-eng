import "./globals.css";

export const metadata = {
  title: "School Gear Borrowing",
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