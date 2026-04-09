import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Preview from './pages/Preview'
import MenuView from './pages/MenuView'
import MenuBuilder from './pages/MenuBuilder'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:id" element={<Editor />} />
        <Route path="/preview/:id" element={<Preview />} />
        <Route path="/menu/:slug" element={<MenuView />} />
        <Route path="/menu-builder" element={<MenuBuilder />} />
        <Route path="/menu-builder/:id" element={<Editor />} />
      </Routes>
    </Layout>
  )
}

export default App
