import '../styles/globals.css';

export const metadata = {
  title: 'SoundTower',
  description: 'Find comforting scripture and prayers for how you feel.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
