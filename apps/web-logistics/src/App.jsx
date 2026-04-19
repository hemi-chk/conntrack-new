import { BrowserRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import Layout from "./layout/Layout"
import Dashboard from "./pages/Dashboard"
import Tracking from "./pages/Tracking"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracking" element={<Tracking />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}