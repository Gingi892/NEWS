import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Base44 App</h1>
          <p className="text-muted-foreground">
            A modern React app built with Vite and Tailwind CSS
          </p>
        </header>

        <main className="max-w-md mx-auto text-center">
          <div className="card bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Counter Example</h2>
            <div className="space-y-4">
              <p className="text-lg">
                Count: <span className="font-mono font-bold">{count}</span>
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setCount((count) => count + 1)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Increment
                </button>
                <button
                  onClick={() => setCount(0)}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center mt-8 text-sm text-muted-foreground">
          <p>Built with ❤️ using Base44 SDK</p>
        </footer>
      </div>
    </div>
  )
}

export default App