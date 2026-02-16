import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductsParser from './pages/ProductsParser'
import PromptsParser from './pages/PromptsParser'
import PromptConfigurator from './pages/PromptConfigurator'
import WritingOverseer from './pages/WritingOverseer'
import FindingStoreCount from './pages/FindingStoreCount'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products-parser" element={<ProductsParser />} />
        <Route path="/prompts-parser" element={<PromptsParser />} />
        <Route path="/writing-overseer" element={<WritingOverseer />} />
        <Route path="/prompt-configurator" element={<PromptConfigurator />} />
        <Route path="/finding-store-count" element={<FindingStoreCount />} />
      </Routes>
    </Layout>
  )
}

export default App
