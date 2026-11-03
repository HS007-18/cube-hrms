import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-[#F0F5FF]">
      <div className="flex items-center justify-center mb-4">
        <img
          src="/cubeai-logo.png"
          alt="CubeAI Solutions"
          className="h-12 w-auto object-contain"
        />
      </div>
      <p className="eyebrow mt-6 text-cube-blue-deep">Error 404</p>
      <h1 className="mt-2 font-heading text-[28px] sm:text-[30px] font-bold text-[#111D36] tracking-tight">This page is not on the map</h1>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#64748B]">
        The link may be outdated, or the page may belong to another workspace.
      </p>
      <div className="mt-6">
        <Button onClick={() => navigate('/')} className="bg-cube-blue-electric text-white font-semibold">
          Back to your workspace
        </Button>
      </div>
    </div>
  )
}
