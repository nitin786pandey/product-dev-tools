import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductsParser from './pages/ProductsParser'
import PromptsParser from './pages/PromptsParser'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products-parser" element={<ProductsParser />} />
        <Route path="/prompts-parser" element={<PromptsParser />} />
      </Routes>
    </Layout>
  )
}

export default App
