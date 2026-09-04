import "./globals.css";

export const metadata = {
  title: "Payment Tracker",
  description: "Daily voucher and payment tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
