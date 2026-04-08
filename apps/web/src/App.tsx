import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Preview from './pages/Preview'
import MenuView from './pages/MenuView'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/preview/:id" element={<Preview />} />
        <Route path="/menu/:slug" element={<MenuView />} />
      </Routes>
    </Layout>
  )
}

export default App
