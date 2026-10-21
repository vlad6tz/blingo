import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { UploadPage } from './pages/UploadPage.tsx'
import { DownloadPage } from './pages/DownloadPage.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <UploadPage/>
  },
  {
    path: '/d/:id',
    element: <DownloadPage/>
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
