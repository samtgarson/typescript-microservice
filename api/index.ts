import { NowRequest, NowResponse } from '@vercel/node'

export default async function (_req: NowRequest, res: NowResponse): Promise<void> {
  res.json({ beep: 'bloop' })
}

