import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductsParser from './pages/ProductsParser'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products-parser" element={<ProductsParser />} />
      </Routes>
    </Layout>
  )
}

export default App
