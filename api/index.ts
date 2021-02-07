import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function (_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.json({ beep: 'bloop' })
}

