import './globals.css'

export const metadata = {
  title: 'Intervuo — Ace Every Interview',
  description: 'AI-powered mock interviews that adapt to your role, give real-time feedback, and help you land the job.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-outfit: 'Outfit', sans-serif;
            --font-bebas: 'Bebas Neue', sans-serif;
          }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
