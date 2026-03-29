import { useHash } from './lib/router'
import { Nav } from './components/Nav'
import { Home } from './pages/Home'
import { DocsLayout } from './pages/docs/DocsLayout'
import './App.css'

function App() {
  const hash = useHash()
  const isDocsPage = hash.startsWith('/docs')

  return (
    <div className="min-h-screen grid-bg">
      <Nav />
      {isDocsPage ? <DocsLayout /> : <Home />}
    </div>
  )
}

export default App
