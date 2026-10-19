import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import { DownloadPage } from './pages/DownloadPage.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App/>
  },
  {
    path: `/d/{id}#key`,
    element: <DownloadPage/>
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
