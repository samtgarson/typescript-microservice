import endpoint from '@/lib/endpoint'
import { VercelRequest, VercelResponse } from '@vercel/node'

const handler = async (_req: VercelRequest, res: VercelResponse): Promise<void> => {
  res.json({ beep: 'bloop' })
}

export default endpoint(handler)
