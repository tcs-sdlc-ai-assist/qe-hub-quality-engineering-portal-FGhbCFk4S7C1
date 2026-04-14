import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { FilterProvider } from './contexts/FilterContext.jsx'
import { initializeData } from './utils/storage.js'
import router from './routes.jsx'

export default function App() {
  useEffect(() => {
    initializeData(false)
  }, [])

  return (
    <AuthProvider>
      <FilterProvider>
        <RouterProvider router={router} />
      </FilterProvider>
    </AuthProvider>
  )
}